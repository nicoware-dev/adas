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
 * Interface for Aries Lend content
 */
export interface AriesLendContent extends Content {
    token: string;
    amount: string | number;
    profileName?: string;
}

/**
 * Type guard for Aries Lend content
 */
function isAriesLendContent(content: unknown): content is AriesLendContent {
    elizaLogger.info("Content for Aries lend", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return typeof c.token === "string" &&
        (typeof c.amount === "string" || typeof c.amount === "number");
}

/**
 * Template for extracting lend information
 */
const ariesLendTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "token": "0x1::aptos_coin::AptosCoin",
    "amount": "100",
    "profileName": "Main account"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Aries Protocol lending operation:
- Token type (e.g., "0x1::aptos_coin::AptosCoin" for APT)
- Amount to lend
- Profile name (if specified, otherwise null)

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
 * Lend tokens in Aries Protocol
 */
async function lendAriesToken(
    aptosClient: Aptos,
    account: Account,
    token: string,
    amount: number,
    profileName = "Main account"
): Promise<string> {
    try {
        const tokenName = getTokenDisplayName(token);
        elizaLogger.info(`Lending ${amount} ${tokenName} on Aries Protocol for profile ${profileName}`);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${ARIES_CONTRACT_ADDRESS}::controller::deposit`,
            typeArguments: [token],
            functionArguments: [profileName, amount, false],
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
            throw new Error("Lend failed");
        }

        elizaLogger.info("Lend completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Lend failed: ${errorMessage}`);
    }
}

/**
 * Handler for ARIES_LEND action
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
            template: ariesLendTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isAriesLendContent(content)) {
            elizaLogger.error("Invalid content for ARIES_LEND action.");
            callback?.({
                text: "Unable to process lending request. Please provide token type and amount.",
                content: { action: "ARIES_LEND", status: "error", error: "Invalid lend content" },
            });
            return false;
        }

        // Use default profile name if not specified
        const profileName = content.profileName || "Main account";
        const tokenName = getTokenDisplayName(content.token);

        // Send a confirmation message first
        callback?.({
            text: `Processing request to lend ${content.amount} ${tokenName} on Aries Protocol...`,
            content: {
                action: "ARIES_LEND",
                status: "pending",
                token: content.token,
                amount: content.amount,
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

        // Lend tokens
        const hash = await lendAriesToken(
            aptosClient,
            account,
            content.token,
            Number(content.amount),
            profileName
        );

        // Format the response
        const response = [
            "# Tokens Lent Successfully on Aries Protocol",
            "",
            `**Token**: ${tokenName}`,
            `**Amount**: ${content.amount}`,
            `**Profile**: ${profileName}`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            `You have successfully lent ${content.amount} ${tokenName} on Aries Protocol.`,
            "Your tokens are now earning interest in the Aries lending pool."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "ARIES_LEND",
                status: "complete",
                transactionHash: hash,
                token: content.token,
                amount: content.amount,
                profileName
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in ARIES_LEND handler:", error);
        callback?.({
            text: `Failed to lend tokens on Aries Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "ARIES_LEND", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for lending tokens on Aries Protocol
 */
const ariesLendAction: Action = {
    name: "ARIES_LEND",
    description: "Lend tokens on Aries Protocol",
    similes: [
        "LEND_ARIES",
        "ARIES_DEPOSIT",
        "DEPOSIT_ARIES",
        "SUPPLY_ARIES"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Lend 100 APT on Aries Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Supply 500 USDC to Aries"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("lend") ||
                messageText.includes("deposit") ||
                messageText.includes("supply")) &&
               messageText.includes("aries");
    },
    suppressInitialMessage: true
};

export default ariesLendAction;
