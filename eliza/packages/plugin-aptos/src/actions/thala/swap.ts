import { elizaLogger } from "@elizaos/core";
import {
    Action,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    Content,
    composeContext,
    generateObjectDeprecated,
} from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey,
    PrivateKey,
    PrivateKeyVariants,
    InputGenerateTransactionPayloadData
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

// Thala Protocol contract address
const THALA_CONTRACT_ADDRESS = "0x6b3720cd988d0ea8d447f0522c8f64b3df3c3945df6d25b84b550b7df5e5cdc8";

/**
 * Interface for Thala Swap content
 */
export interface ThalaSwapContent extends Content {
    amountIn: string | number;
    tokenIn: string;
    tokenOut: string;
    slippage?: string | number;
}

/**
 * Type guard for Thala Swap content
 */
function isThalaSwapContent(content: unknown): content is ThalaSwapContent {
    elizaLogger.info("Content for Thala swap", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amountIn === "string" || typeof c.amountIn === "number") &&
        typeof c.tokenIn === "string" &&
        typeof c.tokenOut === "string"
    );
}

/**
 * Template for extracting swap information
 */
const thalaSwapTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amountIn": "100",
    "tokenIn": "0x1::aptos_coin::AptosCoin",
    "tokenOut": "0x6b3720cd988d0ea8d447f0522c8f64b3df3c3945df6d25b84b550b7df5e5cdc8::thala_token::THALA",
    "slippage": "0.5"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Thala Protocol swap operation:
- Amount to swap (input amount)
- Input token type (e.g., "0x1::aptos_coin::AptosCoin" for APT)
- Output token type (token to receive)
- Slippage tolerance percentage (if specified, otherwise null)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Helper to get token name for display
 */
function getTokenDisplayName(tokenAddress: string): string {
    if (tokenAddress === "0x1::aptos_coin::AptosCoin") {
        return "APT";
    }

    const tokenParts = tokenAddress.split("::");
    if (tokenParts.length > 2) {
        return tokenParts[2];
    }

    return "token";
}

/**
 * Swap tokens on Thala Protocol
 */
async function swapOnThala(
    aptosClient: Aptos,
    account: Account,
    amountIn: number,
    tokenIn: string,
    tokenOut: string,
    slippage: number
): Promise<string> {
    try {
        elizaLogger.info(`Swapping ${amountIn} ${getTokenDisplayName(tokenIn)} for ${getTokenDisplayName(tokenOut)} on Thala Protocol`);

        // Calculate minimum amount out based on slippage (simplified)
        // In a real implementation, you would query the pool for the expected output amount
        const minAmountOut = BigInt(Math.floor(Number(amountIn) * (1 - slippage / 100)));

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${THALA_CONTRACT_ADDRESS}::router::swap_exact_input`,
            typeArguments: [tokenIn, tokenOut],
            functionArguments: [BigInt(amountIn), minAmountOut],
        };

        // Build transaction
        elizaLogger.info("Building transaction");
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: txData,
        });

        // Sign and submit transaction
        elizaLogger.info("Signing and submitting transaction");
        const transactionHash = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction
        });

        // Wait for transaction to be processed
        elizaLogger.info(`Transaction submitted with hash: ${transactionHash.hash}`);
        const signedTransaction = await aptosClient.waitForTransaction({ transactionHash: transactionHash.hash });

        if (!signedTransaction.success) {
            elizaLogger.error("Transaction failed:", signedTransaction);
            throw new Error("Swap failed");
        }

        elizaLogger.info("Swap completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Swap failed: ${errorMessage}`);
    }
}

/**
 * Handler for THALA_SWAP action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract parameters from message
        const context = composeContext({
            state,
            template: thalaSwapTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isThalaSwapContent(content)) {
            elizaLogger.error("Invalid content for THALA_SWAP action.");
            callback?.({
                text: "Unable to process swap request. Please provide input amount, input token, and output token.",
                content: { action: "THALA_SWAP", status: "error", error: "Invalid swap content" },
            });
            return false;
        }

        // Set defaults for optional parameters
        const slippage = content.slippage ? Number(content.slippage) : 0.5; // Default 0.5% slippage

        // Send a confirmation message first
        const tokenInName = getTokenDisplayName(content.tokenIn);
        const tokenOutName = getTokenDisplayName(content.tokenOut);

        callback?.({
            text: `Processing request to swap ${content.amountIn} ${tokenInName} for ${tokenOutName} on Thala Protocol...`,
            content: {
                action: "THALA_SWAP",
                status: "pending",
                amountIn: content.amountIn,
                tokenIn: content.tokenIn,
                tokenOut: content.tokenOut,
                slippage: slippage
            }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const network = config.APTOS_NETWORK as Network;
        const aptosConfig = new AptosConfig({ network });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(
            PrivateKey.formatPrivateKey(
                config.APTOS_PRIVATE_KEY,
                PrivateKeyVariants.Ed25519
            )
        );
        const account = Account.fromPrivateKey({ privateKey });

        // Swap tokens
        const hash = await swapOnThala(
            aptosClient,
            account,
            Number(content.amountIn),
            content.tokenIn,
            content.tokenOut,
            slippage
        );

        // Format the response
        const response = [
            "# Swap Completed Successfully",
            "",
            `**From**: ${content.amountIn} ${tokenInName}`,
            `**To**: ${tokenOutName}`,
            `**Slippage Tolerance**: ${slippage}%`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            `Your swap of ${content.amountIn} ${tokenInName} for ${tokenOutName} has been successfully executed on Thala Protocol.`
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "THALA_SWAP",
                status: "complete",
                transactionHash: hash,
                amountIn: content.amountIn,
                tokenIn: content.tokenIn,
                tokenOut: content.tokenOut,
                slippage: slippage
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in THALA_SWAP handler:", error);
        callback?.({
            text: `Failed to swap tokens on Thala Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "THALA_SWAP", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for swapping tokens on Thala Protocol
 */
const thalaSwapAction: Action = {
    name: "THALA_SWAP",
    description: "Swap tokens on Thala Protocol",
    similes: [
        "SWAP_THALA",
        "THALA_EXCHANGE",
        "EXCHANGE_THALA",
        "SWAP_ON_THALA",
        "EXCHANGE_ON_THALA",
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Swap 10 APT for THALA tokens on Thala Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Exchange 100 USDC for APT on Thala with 1% slippage"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("swap") || messageText.includes("exchange")) &&
               messageText.includes("thala");
    },
    suppressInitialMessage: true
};

export default thalaSwapAction;
