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
    Aptos,
    AptosConfig,
    type Network,
    Account,
    Ed25519PrivateKey,
    PrivateKey,
    PrivateKeyVariants,
    type InputGenerateTransactionPayloadData
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

// Amnis Finance contract address
const AMNIS_CONTRACT_ADDRESS = "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a";

export interface AmnisUnstakeContent extends Content {
    amount: string | number;
    poolId?: string;
}

function isAmnisUnstakeContent(content: unknown): content is AmnisUnstakeContent {
    elizaLogger.info("Content for Amnis unstaking", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number")
    );
}

const amnisUnstakeTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "0.2",
    "poolId": "1"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Amnis Finance unstaking operation:
- Amount to unstake
- Pool ID (if specified, otherwise null)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Unstakes tokens from Amnis Finance
 */
async function unstakeToken(
    aptosClient: Aptos,
    account: Account,
    amount: number,
    poolId: string
): Promise<string> {
    try {
        elizaLogger.info(`Unstaking ${amount} APT from Amnis Finance, Pool ID: ${poolId}`);

        // Convert amount to a number with appropriate decimals
        // APT uses 8 decimals
        const APT_DECIMALS = 8;
        const adjustedAmount = Math.floor(amount * (10 ** APT_DECIMALS));
        elizaLogger.info(`Adjusted amount: ${adjustedAmount}`);

        // Based on the Move Agent Kit example, we need to use the router::unstake_entry function
        const txData: InputGenerateTransactionPayloadData = {
            function: `${AMNIS_CONTRACT_ADDRESS}::router::unstake_entry`,
            functionArguments: [
                adjustedAmount,
                account.accountAddress.toString() // Pass the account address as the recipient
            ],
        };

        elizaLogger.info("Building Amnis unstake transaction with data:", JSON.stringify(txData, null, 2));
        elizaLogger.info("Function arguments types:", txData.functionArguments.map(arg => `${arg} (${typeof arg})`));

        // Build the transaction
        const tx = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: txData,
        });

        // Sign and submit the transaction
        const committedTransaction = await aptosClient.signAndSubmitTransaction({
            signer: account,
            transaction: tx,
        });

        elizaLogger.info(`Transaction submitted with hash: ${committedTransaction.hash}`);

        // Wait for the transaction to be processed
        const executedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransaction.hash,
        });

        if (!executedTransaction.success) {
            elizaLogger.error("Unstaking transaction failed", executedTransaction);
            throw new Error(`Unstaking transaction failed: ${executedTransaction.vm_status || "Unknown error"}`);
        }

        elizaLogger.info("Transaction executed successfully");

        return executedTransaction.hash;
    } catch (error) {
        elizaLogger.error("Error unstaking from Amnis Finance:", error);
        if (error instanceof Error) {
            throw new Error(`Unstaking failed: ${error.message}`);
        }
        throw new Error("Unstaking failed with unknown error");
    }
}

export default {
    name: "AMNIS_UNSTAKE",
    similes: [
        "UNSTAKE_AMNIS",
        "AMNIS_WITHDRAW",
        "WITHDRAW_AMNIS",
        "UNSTAKE_FROM_AMNIS",
        "WITHDRAW_FROM_AMNIS",
    ],
    description: "Unstake APT from Amnis Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting AMNIS_UNSTAKE handler...");

        try {
            // Compose unstake context
            const unstakeContext = composeContext({
                state,
                template: amnisUnstakeTemplate,
            });

            // Generate unstake content
            const content = await generateObjectDeprecated({
                runtime,
                context: unstakeContext,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.info("Generated content:", JSON.stringify(content, null, 2));

            // Validate unstake content
            if (!isAmnisUnstakeContent(content)) {
                elizaLogger.error("Invalid content for AMNIS_UNSTAKE action.");
                if (callback) {
                    callback({
                        text: "Unable to process unstaking request. Please provide an amount to unstake.",
                        content: { action: "AMNIS_UNSTAKE", status: "error", error: "Invalid unstaking content" },
                    });
                }
                return false;
            }

            // Send a confirmation message first
            const poolIdMessage = content.poolId ? ` from pool ${content.poolId}` : "";
            if (callback) {
                callback({
                    text: `Processing request to unstake ${content.amount} APT${poolIdMessage} from Amnis Finance...`,
                    content: {
                        action: "AMNIS_UNSTAKE",
                        status: "pending",
                        amount: content.amount,
                        poolId: content.poolId
                    },
                });
            }

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

            // Set defaults for optional parameters
            const poolId = content.poolId || "1"; // Default pool ID

            // Convert amount to number
            const amount = Number(content.amount);
            if (Number.isNaN(amount) || amount <= 0) {
                throw new Error("Invalid amount. Must be a positive number.");
            }

            // Unstake tokens from Amnis
            const hash = await unstakeToken(
                aptosClient,
                account,
                amount,
                poolId
            );

            // Format the response
            const response = [
                "# Unstaking Successful from Amnis Finance",
                "",
                `**Amount**: ${content.amount} APT`,
                content.poolId ? `**Pool ID**: ${poolId}` : "",
                `**Transaction Hash**: \`${hash}\``,
                "",
                "Your tokens have been successfully unstaked from Amnis Finance.",
                "The unstaked tokens will be available in your wallet."
            ].filter(Boolean).join("\n");

            if (callback) {
                callback({
                    text: response,
                    content: {
                        action: "AMNIS_UNSTAKE",
                        status: "complete",
                        unstake: {
                            amount: content.amount,
                            poolId,
                            transactionHash: hash
                        }
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during Amnis unstaking:", error);
            if (callback) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                callback({
                    text: `Error unstaking from Amnis Finance: ${errorMessage}`,
                    content: {
                        action: "AMNIS_UNSTAKE",
                        status: "error",
                        error: errorMessage
                    },
                });
            }
            return false;
        }
    },

    validate: async (_runtime: IAgentRuntime, message: Memory) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        elizaLogger.info("AMNIS_UNSTAKE validation for user:", message.userId, "with message:", messageText);

        // Check for Amnis-specific keywords
        const hasAmnisKeywords =
            messageText.includes("amnis") ||
            messageText.includes("staking protocol");

        // Check for unstaking-related verbs
        const hasUnstakingVerb =
            messageText.includes("unstake") ||
            messageText.includes("withdraw") ||
            messageText.includes("remove stake") ||
            messageText.includes("remove staking") ||
            messageText.includes("take out");

        // Check for token indicators
        const hasTokenIndicator =
            messageText.includes("apt") ||
            messageText.includes("aptos") ||
            messageText.includes("token") ||
            messageText.includes("coin") ||
            messageText.includes("staked");

        const shouldValidate = hasAmnisKeywords && hasUnstakingVerb && hasTokenIndicator;
        elizaLogger.info("AMNIS_UNSTAKE validation result:", { shouldValidate, hasAmnisKeywords, hasUnstakingVerb, hasTokenIndicator });

        return shouldValidate;
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to unstake 0.2 APT from Amnis Finance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Processing request to unstake 0.2 APT from Amnis Finance...",
                    action: "AMNIS_UNSTAKE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Unstaking Successful from Amnis Finance\n\n**Amount**: 0.2 APT\n**Transaction Hash**: `0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0`\n\nYour tokens have been successfully unstaked from Amnis Finance.\nThe unstaked tokens will be available in your wallet.",
                },
            },
        ],
    ] as ActionExample[][],
    suppressInitialMessage: true,
} as Action;
