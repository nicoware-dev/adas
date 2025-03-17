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
import { validateAptosConfig } from "../../enviroment";
import { normalizeTokenSymbol } from "../../utils/token-utils";

// Amnis Finance contract address
const AMNIS_CONTRACT_ADDRESS = "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a";

export interface AmnisStakeContent extends Content {
    amount: string | number;
    poolId?: string;
}

function isAmnisStakeContent(content: unknown): content is AmnisStakeContent {
    elizaLogger.info("Content for Amnis stake", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return (
        (typeof c.amount === "string" || typeof c.amount === "number")
    );
}

const amnisStakeTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "1000",
    "poolId": "1"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Amnis Finance staking operation:
- Amount to stake (must be at least 0.2 APT)
- Pool ID (if specified, otherwise null)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Stakes tokens on Amnis Finance
 */
async function stakeToken(
    aptosClient: Aptos,
    account: Account,
    amount: number,
    poolId: string
): Promise<string> {
    try {
        elizaLogger.info(`Staking ${amount} APT on Amnis Finance, Pool ID: ${poolId}`);

        // Amnis requires a minimum of 0.2 APT for staking
        const MINIMUM_STAKE_AMOUNT = 0.2;
        if (amount < MINIMUM_STAKE_AMOUNT) {
            throw new Error(`Amount must be at least ${MINIMUM_STAKE_AMOUNT} APT. You provided ${amount} APT.`);
        }

        // Convert amount to a number with appropriate decimals
        // APT uses 8 decimals
        const APT_DECIMALS = 8;
        const adjustedAmount = Math.floor(amount * (10 ** APT_DECIMALS));
        elizaLogger.info(`Adjusted amount: ${adjustedAmount}`);

        // Based on the Move Agent Kit example, we need to use the router::deposit_and_stake_entry function
        const txData: InputGenerateTransactionPayloadData = {
            function: `${AMNIS_CONTRACT_ADDRESS}::router::deposit_and_stake_entry`,
            functionArguments: [
                adjustedAmount,
                account.accountAddress.toString() // Pass the account address as the recipient
            ],
        };

        elizaLogger.info("Building Amnis stake transaction with data:", JSON.stringify(txData, null, 2));
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
            elizaLogger.error("Staking transaction failed", executedTransaction);
            throw new Error(`Staking transaction failed: ${executedTransaction.vm_status || "Unknown error"}`);
        }

        elizaLogger.info("Transaction executed successfully");

        return executedTransaction.hash;
    } catch (error) {
        elizaLogger.error("Error staking on Amnis Finance:", error);
        if (error instanceof Error) {
            throw new Error(`Staking failed: ${error.message}`);
        }
        throw new Error("Staking failed with unknown error");
    }
}

export default {
    name: "AMNIS_STAKE",
    similes: [
        "STAKE_AMNIS",
        "AMNIS_DEPOSIT",
        "DEPOSIT_AMNIS",
        "STAKE_ON_AMNIS",
        "DEPOSIT_ON_AMNIS",
    ],
    description: "Stake APT on Amnis Finance",
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info("Starting AMNIS_STAKE handler...");

        try {
            // Compose stake context
            const stakeContext = composeContext({
                state,
                template: amnisStakeTemplate,
            });

            // Generate stake content
            const content = await generateObjectDeprecated({
                runtime,
                context: stakeContext,
                modelClass: ModelClass.SMALL,
            });

            elizaLogger.info("Generated content:", JSON.stringify(content, null, 2));

            // Validate stake content
            if (!isAmnisStakeContent(content)) {
                elizaLogger.error("Invalid content for AMNIS_STAKE action.");
                if (callback) {
                    callback({
                        text: "Unable to process staking request. Please provide an amount to stake.",
                        content: { action: "AMNIS_STAKE", status: "error", error: "Invalid staking content" },
                    });
                }
                return false;
            }

            // Send a confirmation message first
            if (callback) {
                callback({
                    text: `Processing request to stake ${content.amount} APT on Amnis Finance...`,
                    content: {
                        action: "AMNIS_STAKE",
                        status: "pending",
                        amount: content.amount,
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

            // Check minimum staking amount
            const MINIMUM_STAKE_AMOUNT = 0.2;
            if (amount < MINIMUM_STAKE_AMOUNT) {
                if (callback) {
                    callback({
                        text: `Error staking on Amnis Finance: Amount must be at least ${MINIMUM_STAKE_AMOUNT} APT. You provided ${amount} APT.`,
                        content: {
                            action: "AMNIS_STAKE",
                            status: "error",
                            error: `Amount must be at least ${MINIMUM_STAKE_AMOUNT} APT. You provided ${amount} APT.`
                        },
                    });
                }
                return false;
            }

            // Stake tokens on Amnis
            const hash = await stakeToken(
                aptosClient,
                account,
                amount,
                poolId
            );

            // Format the response
            const response = [
                "# Staking Successful on Amnis Finance",
                "",
                `**Amount**: ${content.amount} APT`,
                `**Pool ID**: ${poolId}`,
                `**Transaction Hash**: \`${hash}\``,
                "",
                "Your tokens have been successfully staked on Amnis Finance.",
                "You can view your position on the Amnis Finance dashboard."
            ].join("\n");

            if (callback) {
                callback({
                    text: response,
                    content: {
                        action: "AMNIS_STAKE",
                        status: "complete",
                        stake: {
                            amount: content.amount,
                            poolId,
                            transactionHash: hash
                        }
                    },
                });
            }

            return true;
        } catch (error) {
            elizaLogger.error("Error during Amnis staking:", error);
            if (callback) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error";
                callback({
                    text: `Error staking on Amnis Finance: ${errorMessage}`,
                    content: {
                        action: "AMNIS_STAKE",
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
        elizaLogger.info("AMNIS_STAKE validation for user:", message.userId, "with message:", messageText);

        // Check for Amnis-specific keywords
        const hasAmnisKeywords =
            messageText.includes("amnis") ||
            messageText.includes("staking protocol");

        // Check for staking-related verbs
        const hasStakingVerb =
            messageText.includes("stake") ||
            messageText.includes("deposit") ||
            messageText.includes("staking");

        // Check for token indicators
        const hasTokenIndicator =
            messageText.includes("apt") ||
            messageText.includes("aptos") ||
            messageText.includes("token") ||
            messageText.includes("coin");

        const shouldValidate = hasAmnisKeywords && hasStakingVerb && hasTokenIndicator;
        elizaLogger.info("AMNIS_STAKE validation result:", { shouldValidate, hasAmnisKeywords, hasStakingVerb, hasTokenIndicator });

        return shouldValidate;
    },

    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I want to stake 0.5 APT on Amnis Finance",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Processing request to stake 0.5 APT on Amnis Finance...",
                    action: "AMNIS_STAKE",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "# Staking Successful on Amnis Finance\n\n**Amount**: 0.5 APT\n**Pool ID**: 1\n**Transaction Hash**: `0x39a8c432d9bdad993a33cc1faf2e9b58fb7dd940c0425f1d6db3997e4b4b05c0`\n\nYour tokens have been successfully staked on Amnis Finance.\nYou can view your position on the Amnis Finance dashboard.",
                },
            },
        ],
    ] as ActionExample[][],
    suppressInitialMessage: true,
} as Action;
