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
 * Interface for Aries Borrow content
 */
export interface AriesBorrowContent extends Content {
    token: string;
    amount: string | number;
    profileName?: string;
}

/**
 * Type guard for Aries Borrow content
 */
function isAriesBorrowContent(content: unknown): content is AriesBorrowContent {
    elizaLogger.info("Content for Aries borrow", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return typeof c.token === "string" &&
        (typeof c.amount === "string" || typeof c.amount === "number");
}

/**
 * Template for extracting borrow information
 */
const ariesBorrowTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "token": "0x1::aptos_coin::AptosCoin",
    "amount": "100",
    "profileName": "Main account"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Aries Protocol borrowing operation:
- Token type (e.g., "0x1::aptos_coin::AptosCoin" for APT)
- Amount to borrow
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
 * Borrow tokens in Aries Protocol
 */
async function borrowAriesToken(
    aptosClient: Aptos,
    account: Account,
    token: string,
    amount: number,
    profileName = "Main account"
): Promise<string> {
    try {
        const tokenName = getTokenDisplayName(token);
        elizaLogger.info(`Borrowing ${amount} ${tokenName} on Aries Protocol for profile ${profileName}`);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${ARIES_CONTRACT_ADDRESS}::controller::borrow`,
            typeArguments: [token],
            functionArguments: [profileName, amount],
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
            throw new Error("Borrow failed");
        }

        elizaLogger.info("Borrow completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Borrow failed: ${errorMessage}`);
    }
}

/**
 * Handler for ARIES_BORROW action
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
            template: ariesBorrowTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isAriesBorrowContent(content)) {
            elizaLogger.error("Invalid content for ARIES_BORROW action.");
            callback?.({
                text: "Unable to process borrowing request. Please provide token type and amount.",
                content: { action: "ARIES_BORROW", status: "error", error: "Invalid borrow content" },
            });
            return false;
        }

        // Use default profile name if not specified
        const profileName = content.profileName || "Main account";
        const tokenName = getTokenDisplayName(content.token);

        // Send a confirmation message first
        callback?.({
            text: `Processing request to borrow ${content.amount} ${tokenName} on Aries Protocol...`,
            content: {
                action: "ARIES_BORROW",
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

        // Borrow tokens
        const hash = await borrowAriesToken(
            aptosClient,
            account,
            content.token,
            Number(content.amount),
            profileName
        );

        // Format the response
        const response = [
            "# Tokens Borrowed Successfully on Aries Protocol",
            "",
            `**Token**: ${tokenName}`,
            `**Amount**: ${content.amount}`,
            `**Profile**: ${profileName}`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            `You have successfully borrowed ${content.amount} ${tokenName} on Aries Protocol.`,
            "Remember to monitor your health factor and repay your loan on time."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "ARIES_BORROW",
                status: "complete",
                transactionHash: hash,
                token: content.token,
                amount: content.amount,
                profileName
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in ARIES_BORROW handler:", error);
        callback?.({
            text: `Failed to borrow tokens on Aries Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "ARIES_BORROW", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for borrowing tokens on Aries Protocol
 */
const ariesBorrowAction: Action = {
    name: "ARIES_BORROW",
    description: "Borrow tokens on Aries Protocol",
    similes: [
        "BORROW_ARIES",
        "ARIES_LOAN",
        "LOAN_ARIES"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Borrow 50 APT on Aries Protocol"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Take a loan of 1000 USDC from Aries"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("borrow") ||
                messageText.includes("loan") ||
                messageText.includes("take loan")) &&
               messageText.includes("aries");
    },
    suppressInitialMessage: true
};

export default ariesBorrowAction;
