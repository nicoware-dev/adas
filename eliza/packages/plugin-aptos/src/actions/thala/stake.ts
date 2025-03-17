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
 * Interface for Thala Stake content
 */
export interface ThalaStakeContent extends Content {
    amount: string | number;
}

/**
 * Type guard for Thala Stake content
 */
function isThalaStakeContent(content: unknown): content is ThalaStakeContent {
    elizaLogger.info("Content for Thala stake", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return (typeof c.amount === "string" || typeof c.amount === "number");
}

/**
 * Template for extracting stake information
 */
const thalaStakeTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "10"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Thala Protocol stake operation:
- Amount of APT to stake

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Stake APT in Thala Protocol
 */
async function stakeAPTWithThala(
    aptosClient: Aptos,
    account: Account,
    amount: number
): Promise<string> {
    try {
        elizaLogger.info(`Staking ${amount} APT on Thala Protocol`);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${THALA_STAKING_ADDRESS}::scripts::stake_APT_and_thAPT`,
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
            throw new Error("Stake APT failed");
        }

        elizaLogger.info("Stake APT completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Stake APT failed: ${errorMessage}`);
    }
}

/**
 * Handler for THALA_STAKE action
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
            template: thalaStakeTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isThalaStakeContent(content)) {
            elizaLogger.error("Invalid content for THALA_STAKE action.");
            callback?.({
                text: "Unable to process stake request. Please provide the amount of APT to stake.",
                content: { action: "THALA_STAKE", status: "error", error: "Invalid stake content" },
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Processing request to stake ${content.amount} APT on Thala Protocol...`,
            content: {
                action: "THALA_STAKE",
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

        // Stake APT
        const hash = await stakeAPTWithThala(
            aptosClient,
            account,
            Number(content.amount)
        );

        // Format the response
        const response = [
            "# APT Staked Successfully",
            "",
            `**Amount**: ${content.amount} APT`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            "Your APT has been successfully staked on Thala Protocol.",
            "You will receive thAPT tokens that represent your staked position and can be used in other DeFi activities."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "THALA_STAKE",
                status: "complete",
                transactionHash: hash,
                amount: content.amount
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in THALA_STAKE handler:", error);
        callback?.({
            text: `Failed to stake APT on Thala Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "THALA_STAKE", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for staking APT on Thala Protocol
 */
const thalaStakeAction: Action = {
    name: "THALA_STAKE",
    description: "Stake APT on Thala Protocol",
    similes: [
        "STAKE_THALA",
        "THALA_STAKE_APT",
        "STAKE_APT_THALA",
        "DEPOSIT_STAKE_THALA"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Stake 10 APT on Thala Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "I want to stake my APT on Thala"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return messageText.includes("stake") &&
               messageText.includes("apt") &&
               messageText.includes("thala");
    },
    suppressInitialMessage: true
};

export default thalaStakeAction;
