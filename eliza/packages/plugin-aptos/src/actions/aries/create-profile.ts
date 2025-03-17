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

// Aries Protocol contract address
const ARIES_CONTRACT_ADDRESS = "0x9770fa9c725cbd97eb50b2be5f7416efdfd1f1554beb0750d4dae4c64e860da3";

/**
 * Interface for Aries Create Profile content
 */
export interface AriesCreateProfileContent extends Content {
    profileName?: string;
}

/**
 * Type guard for Aries Create Profile content
 */
function isAriesCreateProfileContent(content: unknown): content is AriesCreateProfileContent {
    elizaLogger.info("Content for Aries create profile", content);
    return true; // No required fields, all parameters have defaults
}

/**
 * Template for extracting create profile information
 */
const ariesCreateProfileTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "profileName": "Main account"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Aries Protocol profile creation:
- Profile name (if specified, otherwise null)

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Create a profile in Aries Protocol
 */
async function createAriesProfile(
    aptosClient: Aptos,
    account: Account,
    profileName: string = "Main account"
): Promise<string> {
    try {
        elizaLogger.info(`Creating Aries profile with name: ${profileName}`);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${ARIES_CONTRACT_ADDRESS}::controller::register_user`,
            functionArguments: [profileName],
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
            throw new Error("Create profile failed");
        }

        elizaLogger.info("Create profile completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Create profile failed: ${errorMessage}`);
    }
}

/**
 * Handler for ARIES_CREATE_PROFILE action
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
            template: ariesCreateProfileTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        // Use default profile name if not specified
        const profileName = content.profileName || "Main account";

        // Send a confirmation message first
        callback?.({
            text: `Processing request to create Aries profile "${profileName}"...`,
            content: {
                action: "ARIES_CREATE_PROFILE",
                status: "pending",
                profileName
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

        // Create Aries profile
        const hash = await createAriesProfile(
            aptosClient,
            account,
            profileName
        );

        // Format the response
        const response = [
            "# Aries Profile Created Successfully",
            "",
            `**Profile Name**: ${profileName}`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            "Your profile has been successfully created on Aries Protocol.",
            "You can now use Aries lending and borrowing features."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "ARIES_CREATE_PROFILE",
                status: "complete",
                transactionHash: hash,
                profileName
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in ARIES_CREATE_PROFILE handler:", error);
        callback?.({
            text: `Failed to create profile on Aries Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "ARIES_CREATE_PROFILE", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for creating a profile on Aries Protocol
 */
const ariesCreateProfileAction: Action = {
    name: "ARIES_CREATE_PROFILE",
    description: "Create a profile on Aries Protocol",
    similes: [
        "CREATE_PROFILE_ARIES",
        "ARIES_REGISTER",
        "REGISTER_ARIES",
        "SIGNUP_ARIES"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Create a profile on Aries Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Register on Aries with profile name 'Trading Account'"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("create profile") ||
                messageText.includes("register") ||
                messageText.includes("signup")) &&
               messageText.includes("aries");
    },
    suppressInitialMessage: true
};

export default ariesCreateProfileAction;
