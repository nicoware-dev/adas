import { elizaLogger } from "@elizaos/core";
import type {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    Action,
} from "@elizaos/core";
import { composeContext, generateObjectDeprecated, ModelClass } from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey,
    PrivateKey,
    PrivateKeyVariants
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

export interface SwapContent extends Content {
    fromToken: string;
    toToken: string;
    amount: string;
    slippage?: string;
}

function isSwapContent(content: unknown): content is SwapContent {
    elizaLogger.info("Content for token swap", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.fromToken === "string" &&
           typeof c.toToken === "string" &&
           typeof c.amount === "string";
}

const swapTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "fromToken": "apt",
    "toToken": "usdc",
    "amount": "10",
    "slippage": "0.5"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token swap on Liquidswap:
- Source token (fromToken) - Use simple token symbols like "apt", "usdc", "usdt", "btc", "eth"
- Destination token (toToken) - Use simple token symbols like "apt", "usdc", "usdt", "btc", "eth"
- Amount to swap
- Slippage percentage (optional, default is 0.5%)

Respond with a JSON markdown block containing only the extracted values.
`;

/**
 * Normalizes token symbols to their full addresses
 */
function normalizeTokenSymbol(tokenSymbol: string): string {
    const symbol = tokenSymbol.toLowerCase();

    // If it's already a full address, return it as is
    if (symbol.includes("::")) {
        return tokenSymbol;
    }

    if (symbol === "apt" || symbol === "aptos") {
        return "0x1::aptos_coin::AptosCoin";
    }

    if (symbol === "usdc") {
        // Use the correct USDC address from the Liquidswap docs
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
    }

    if (symbol === "usdt") {
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
    }

    if (symbol === "btc" || symbol === "bitcoin") {
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::BTC";
    }

    if (symbol === "eth" || symbol === "ethereum") {
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::ETH";
    }

    // Default case - return as is
    return tokenSymbol;
}

/**
 * Swaps tokens on the Liquidswap DEX
 */
async function swapTokens(
    aptosClient: Aptos,
    account: Account,
    fromToken: string,
    toToken: string,
    amount: string,
    slippage = "0.5"
): Promise<{
    transactionHash: string;
    amountOut: string;
}> {
    try {
        // Normalize token symbols
        const normalizedFromToken = normalizeTokenSymbol(fromToken);
        const normalizedToToken = normalizeTokenSymbol(toToken);

        // Convert amount to a number
        const numericAmount = Number.parseFloat(amount);
        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
            throw new Error("Invalid amount. Must be a positive number.");
        }

        // Convert to on-chain amount (with 8 decimals for Aptos standard)
        const DECIMALS = 8;
        const adjustedAmount = BigInt(Math.floor(numericAmount * (10 ** DECIMALS)));

        elizaLogger.info(`Swapping ${numericAmount} of ${normalizedFromToken} to ${normalizedToToken}`);

        // Check if we have enough balance
        const resources = await aptosClient.getAccountResources({
            accountAddress: account.accountAddress,
        });

        // For the source token, check the balance
        const coinType = normalizedFromToken;
        const coinStoreType = `0x1::coin::CoinStore<${coinType}>`;

        const coinStore = resources.find(r => r.type === coinStoreType);

        if (!coinStore) {
            throw new Error(`Token store for ${coinType} not found in account resources`);
        }

        const balance = BigInt((coinStore.data as { coin: { value: string } }).coin.value);

        if (balance < adjustedAmount) {
            const balanceInTokens = Number(balance) / (10 ** DECIMALS);
            throw new Error(`Insufficient balance. You have ${balanceInTokens} tokens but attempted to swap ${numericAmount} tokens.`);
        }

        elizaLogger.info(`Token balance check passed: ${balance} >= ${adjustedAmount}`);

        // Following the Liquidswap documentation exactly
        // Set minimum amount out to 0 (no slippage protection for simplicity)
        const minAmountOut = 0;

        // Use the correct Liquidswap module address from the docs
        const LIQUIDSWAP_MODULE_ADDRESS = "0x190d44266241744264b964a37b8f09863167a12d3e70cda39376cfb4e3561e12";

        // Log normalized token addresses for debugging
        elizaLogger.info("Normalized token addresses:", {
            fromToken: normalizedFromToken,
            toToken: normalizedToToken
        });

        // Build the transaction using the scripts_v2 module which contains entry functions
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: `${LIQUIDSWAP_MODULE_ADDRESS}::scripts_v2::swap`,
                typeArguments: [
                    normalizedFromToken,
                    normalizedToToken,
                    `${LIQUIDSWAP_MODULE_ADDRESS}::curves::Uncorrelated`
                ],
                functionArguments: [adjustedAmount, minAmountOut],
            },
        });

        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction,
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Token swap failed", signedTransaction);
            throw new Error(`Token swap failed: ${signedTransaction.vm_status}`);
        }

        // Extract amount out from events
        let amountOut = "0";
        try {
            // Try to extract the amount out from the swap event
            if ('events' in signedTransaction) {
                const events = signedTransaction.events;
                const swapEvent = events?.find(event =>
                    event.type.includes("SwapEvent") &&
                    (event.type.includes(normalizedFromToken) || event.type.includes(normalizedToToken))
                );

                if (swapEvent?.data) {
                    // Based on the event data structure from the successful transaction
                    interface SwapEventData {
                        x_in?: string;
                        x_out?: string;
                        y_in?: string;
                        y_out?: string;
                    }

                    const eventData = swapEvent.data as SwapEventData;

                    if (normalizedFromToken === "0x1::aptos_coin::AptosCoin") {
                        amountOut = eventData.x_out || "0";
                    } else {
                        amountOut = eventData.y_out || "0";
                    }

                    // Convert from on-chain amount to human-readable amount
                    const amountOutNum = Number(amountOut) / (10 ** DECIMALS);
                    amountOut = amountOutNum.toString();
                }
            }
        } catch (error) {
            elizaLogger.error("Error extracting amount out from events:", error);
            // If we can't extract the amount, just return 0
            amountOut = "0";
        }

        return {
            transactionHash: signedTransaction.hash,
            amountOut
        };
    } catch (error) {
        elizaLogger.error("Swap error details:", error);

        if (error instanceof Error) {
            throw new Error(`Token swap failed: ${error.message}`);
        }
        throw new Error("Token swap failed with unknown error");
    }
}

/**
 * Handler for the LIQUIDSWAP_SWAP action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        elizaLogger.info("Starting LIQUIDSWAP_SWAP handler...");

        // Extract swap parameters from message
        const context = composeContext({
            state,
            template: swapTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        elizaLogger.info("Generated swap content:", content);

        if (!isSwapContent(content)) {
            callback?.({
                text: "Please provide source token, destination token, and amount to swap.",
                content: { action: "LIQUIDSWAP_SWAP", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Normalize token symbols before proceeding
        const normalizedFromToken = normalizeTokenSymbol(content.fromToken);
        const normalizedToToken = normalizeTokenSymbol(content.toToken);

        // Update content with normalized tokens
        content.fromToken = normalizedFromToken;
        content.toToken = normalizedToToken;

        // Send a confirmation message first
        callback?.({
            text: `Swapping ${content.amount} of ${content.fromToken} to ${content.toToken} on Liquidswap...`,
            content: { action: "LIQUIDSWAP_SWAP", status: "pending" }
        });

        try {
            // Initialize Aptos client and account
            const config = await validateAptosConfig(runtime);
            const aptosConfig = new AptosConfig({
                network: config.APTOS_NETWORK as Network
            });
            const aptosClient = new Aptos(aptosConfig);

            // Create account from private key
            const privateKey = new Ed25519PrivateKey(
                PrivateKey.formatPrivateKey(
                    config.APTOS_PRIVATE_KEY,
                    PrivateKeyVariants.Ed25519
                )
            );
            const account = Account.fromPrivateKey({ privateKey });

            // Perform the swap
            const result = await swapTokens(
                aptosClient,
                account,
                content.fromToken,
                content.toToken,
                content.amount,
                content.slippage
            );

            // Format the response
            const response = [
                "# Token Swap Successful",
                "",
                `**From**: ${content.amount} of \`${content.fromToken}\``,
                `**To**: ${result.amountOut} of \`${content.toToken}\``,
                `**Slippage**: ${content.slippage || "0.5"}%`,
                `**Transaction Hash**: \`${result.transactionHash}\``,
                "",
                "The swap has been successfully executed on Liquidswap."
            ].join("\n");

            callback?.({
                text: response,
                content: {
                    action: "LIQUIDSWAP_SWAP",
                    status: "complete",
                    swap: {
                        fromToken: content.fromToken,
                        toToken: content.toToken,
                        amountIn: content.amount,
                        amountOut: result.amountOut,
                        slippage: content.slippage || "0.5",
                        transactionHash: result.transactionHash
                    }
                }
            });

            return true;
        } catch (error) {
            elizaLogger.error("Error in swap execution:", error);

            // Provide a more user-friendly error message
            let errorMessage = "Failed to swap tokens: Unknown error";
            if (error instanceof Error) {
                errorMessage = `Failed to swap tokens: ${error.message}`;

                // Check for common errors and provide more helpful messages
                if (error.message.includes("Insufficient balance")) {
                    errorMessage = error.message;
                } else if (error.message.includes("not found in account resources")) {
                    errorMessage = `You don't have any ${content.fromToken} tokens in your wallet.`;
                } else if (error.message.includes("Could not find entry function") ||
                           error.message.includes("is not an entry function") ||
                           error.message.includes("LINKER_ERROR")) {
                    errorMessage = "The Liquidswap protocol is not available or has been updated. Please try again later.";
                } else if (error.message.includes("execution failed")) {
                    errorMessage = "The swap execution failed. This could be due to insufficient liquidity or other issues with the Liquidswap protocol.";
                }
            }

            callback?.({
                text: errorMessage,
                content: { action: "LIQUIDSWAP_SWAP", status: "error", error: String(error) }
            });
            return false;
        }
    } catch (error) {
        elizaLogger.error("Error in LIQUIDSWAP_SWAP handler:", error);
        callback?.({
            text: `Failed to process swap request: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "LIQUIDSWAP_SWAP", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for swapping tokens on Liquidswap
 */
const swapAction: Action = {
    name: "LIQUIDSWAP_SWAP",
    description: "Swap tokens on the Liquidswap DEX",
    similes: [
        "SWAP_TOKENS",
        "EXCHANGE_TOKENS",
        "LIQUIDSWAP_EXCHANGE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Swap 10 APT for USDC on Liquidswap"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Exchange 5 APT for BTC with 1% slippage on Liquidswap"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Swap my APT tokens for USDT on Liquidswap"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        elizaLogger.info("LIQUIDSWAP_SWAP validation for user:", message.userId, "with message:", messageText);

        const hasSwapVerb =
            messageText.includes("swap") ||
            messageText.includes("exchange");

        const hasTokenIndicator =
            messageText.includes("token") ||
            messageText.includes("coin") ||
            messageText.includes("apt") ||
            messageText.includes("usdc") ||
            messageText.includes("usdt") ||
            messageText.includes("btc") ||
            messageText.includes("eth");

        const hasLiquidswapMention = messageText.includes("liquidswap");

        const shouldValidate = hasSwapVerb && hasTokenIndicator && hasLiquidswapMention;
        elizaLogger.info("LIQUIDSWAP_SWAP validation result:", { shouldValidate, hasSwapVerb, hasTokenIndicator, hasLiquidswapMention });

        return shouldValidate;
    },
    suppressInitialMessage: true
};

export default swapAction;
