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

// Thala Protocol staking contract address
const THALA_STAKING_ADDRESS = "0xfaf4e633ae9eb31366c9ca24214231760926576c7b625313b3688b5e900731f6";

/**
 * Interface for Thala Unstake content
 */
export interface ThalaUnstakeContent extends Content {
    amount: string | number;
}

/**
 * Type guard for Thala Unstake content
 */
function isThalaUnstakeContent(content: unknown): content is ThalaUnstakeContent {
    elizaLogger.info("Content for Thala unstake", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return (typeof c.amount === "string" || typeof c.amount === "number");
}

/**
 * Template for extracting unstake information
 */
const thalaUnstakeTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "10"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Thala Protocol unstake operation:
- Amount of thAPT to unstake

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Unstake thAPT in Thala Protocol
 */
async function unstakeWithThala(
    aptosClient: Aptos,
    account: Account,
    amount: number
): Promise<string> {
    try {
        elizaLogger.info(`Unstaking ${amount} thAPT on Thala Protocol`);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${THALA_STAKING_ADDRESS}::scripts::unstake_thAPT`,
            functionArguments: [amount],
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
            throw new Error("Unstake thAPT failed");
        }

        elizaLogger.info("Unstake thAPT completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Unstake thAPT failed: ${errorMessage}`);
    }
}

/**
 * Handler for THALA_UNSTAKE action
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
            template: thalaUnstakeTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isThalaUnstakeContent(content)) {
            elizaLogger.error("Invalid content for THALA_UNSTAKE action.");
            callback?.({
                text: "Unable to process unstake request. Please provide the amount of thAPT to unstake.",
                content: { action: "THALA_UNSTAKE", status: "error", error: "Invalid unstake content" },
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Processing request to unstake ${content.amount} thAPT on Thala Protocol...`,
            content: {
                action: "THALA_UNSTAKE",
                status: "pending",
                amount: content.amount
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

        // Unstake thAPT
        const hash = await unstakeWithThala(
            aptosClient,
            account,
            Number(content.amount)
        );

        // Format the response
        const response = [
            "# thAPT Unstaked Successfully",
            "",
            `**Amount**: ${content.amount} thAPT`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            "Your thAPT has been successfully unstaked on Thala Protocol.",
            "The corresponding APT tokens have been returned to your account."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "THALA_UNSTAKE",
                status: "complete",
                transactionHash: hash,
                amount: content.amount
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in THALA_UNSTAKE handler:", error);
        callback?.({
            text: `Failed to unstake thAPT on Thala Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "THALA_UNSTAKE", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for unstaking thAPT on Thala Protocol
 */
const thalaUnstakeAction: Action = {
    name: "THALA_UNSTAKE",
    description: "Unstake thAPT on Thala Protocol",
    similes: [
        "UNSTAKE_THALA",
        "THALA_UNSTAKE_APT",
        "UNSTAKE_APT_THALA",
        "WITHDRAW_STAKE_THALA"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Unstake 10 thAPT on Thala Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "I want to unstake my thAPT on Thala"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return messageText.includes("unstake") &&
               (messageText.includes("apt") || messageText.includes("thapt")) &&
               messageText.includes("thala");
    },
    suppressInitialMessage: true
};

export default thalaUnstakeAction;
