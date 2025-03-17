import { elizaLogger } from "@elizaos/core";
import {
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    type Action,
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import {
    Account,
    Aptos,
    AptosConfig,
    Ed25519PrivateKey,
    type Network,
    PrivateKey,
    PrivateKeyVariants,
    type InputGenerateTransactionPayloadData,
} from "@aptos-labs/ts-sdk";
import { walletProvider } from "../../providers/wallet";

// Thala Protocol contract address
const THALA_CONTRACT_ADDRESS = "0x6b3720cd988d0ea8d447f0522c8f64b3df3c3945df6d25b84b550b7df5e5cdc8";

export interface ThalaSwapContent extends Content {
    amountIn: string | number;
    tokenIn: string;
    tokenOut: string;
    slippage?: string | number;
}

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

export default {
    name: "THALA_SWAP",
    similes: [
        "SWAP_THALA",
        "THALA_EXCHANGE",
        "EXCHANGE_THALA",
        "SWAP_ON_THALA",
        "EXCHANGE_ON_THALA",
    ],
    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        elizaLogger.info("Validating Thala swap from user:", message.userId);
        return true;
    },
    description: "Swap tokens on Thala Protocol",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting THALA_SWAP handler...");

        const walletInfo = await walletProvider.get(runtime, message, state);
        state.walletInfo = walletInfo;

        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Compose swap context
        const swapContext = composeContext({
            state: currentState,
            template: thalaSwapTemplate,
        });

        // Generate swap content
        const content = await generateObjectDeprecated({
            runtime,
            context: swapContext,
            modelClass: ModelClass.SMALL,
        });

        // Validate swap content
        if (!isThalaSwapContent(content)) {
            elizaLogger.error("Invalid content for THALA_SWAP action.");
            if (callback) {
                callback({
                    text: "Unable to process swap request. Invalid content provided.",
                    content: { error: "Invalid swap content" },
                });
            }
            return false;
        }

        try {
            const privateKey = runtime.getSetting("APTOS_PRIVATE_KEY");
            const aptosAccount = Account.fromPrivateKey({
                privateKey: new Ed25519PrivateKey(
                    PrivateKey.formatPrivateKey(
                        privateKey,
                        PrivateKeyVariants.Ed25519
                    )
                ),
            });
            const network = runtime.getSetting("APTOS_NETWORK") as Network;
            const aptosClient = new Aptos(
                new AptosConfig({
                    network,
                })
            );

            // Set defaults for optional parameters
            const slippage = content.slippage ? Number(content.slippage) : 0.5; // Default 0.5% slippage

            // Convert amount to number and adjust for decimals (assuming APT for simplicity)
            const APT_DECIMALS = 8;
            const adjustedAmountIn = BigInt(
                Number(content.amountIn) * (10 ** APT_DECIMALS)
            );

            // Calculate minimum amount out based on slippage (simplified)
            // In a real implementation, you would query the pool for the expected output amount
            const minAmountOut = BigInt(
                Number(adjustedAmountIn) * 0.98 // Simplified: 2% less than input as minimum output
            );

            // Prepare transaction data
            const txData: InputGenerateTransactionPayloadData = {
                function: `${THALA_CONTRACT_ADDRESS}::router::swap_exact_input`,
                typeArguments: [content.tokenIn, content.tokenOut],
                functionArguments: [adjustedAmountIn, minAmountOut],
            };

            elizaLogger.info("Building Thala swap transaction with data:", txData);

            const tx = await aptosClient.transaction.build.simple({
                sender: aptosAccount.accountAddress.toStringLong(),
                data: txData,
            });

            const committedTransaction =
                await aptosClient.signAndSubmitTransaction({
                    signer: aptosAccount,
                    transaction: tx,
                });

            const executedTransaction = await aptosClient.waitForTransaction({
                transactionHash: committedTransaction.hash,
            });

            if (!executedTransaction.success) {
                throw new Error("Swap transaction failed");
            }

            elizaLogger.info("Thala swap successful:", executedTransaction.hash);

            // Extract token names for display
            let tokenInName = "tokens";
            let tokenOutName = "tokens";

            if (content.tokenIn === "0x1::aptos_coin::AptosCoin") {
                tokenInName = "APT";
            } else {
                const tokenInParts = content.tokenIn.split("::");
                tokenInName = tokenInParts.length > 2 ? tokenInParts[2] : "tokens";
            }

            if (content.tokenOut === "0x1::aptos_coin::AptosCoin") {
                tokenOutName = "APT";
            } else {
                const tokenOutParts = content.tokenOut.split("::");
                tokenOutName = tokenOutParts.length > 2 ? tokenOutParts[2] : "tokens";
            }

            if (callback) {
                callback({
                    text: `Successfully swapped ${content.amountIn} ${tokenInName} for ${tokenOutName} on Thala Protocol. Transaction: ${executedTransaction.hash}`,
                    content: {
                        success: true,
                        hash: executedTransaction.hash,
                        amountIn: content.amountIn,
                        tokenIn: content.tokenIn,
                        tokenOut: content.tokenOut,
                        slippage: slippage,
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during Thala swap:", error);
            if (callback) {
                callback({
                    text: `Error swapping on Thala Protocol: ${error.message}`,
                    content: { error: error.message },
                });
            }
            return false;
        }
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to swap 10 APT for THALA tokens on Thala Protocol",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "I'll process your swap request on Thala Protocol...",
                    action: "THALA_SWAP",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Successfully swapped 10 APT for THALA on Thala Protocol. Transaction: 0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;
