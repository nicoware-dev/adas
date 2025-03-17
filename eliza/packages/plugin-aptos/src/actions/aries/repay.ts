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
 * Interface for Aries Repay content
 */
export interface AriesRepayContent extends Content {
    token: string;
    amount: string | number;
    profileName?: string;
}

/**
 * Type guard for Aries Repay content
 */
function isAriesRepayContent(content: unknown): content is AriesRepayContent {
    elizaLogger.info("Content for Aries repay", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;

    // Validate required fields
    return typeof c.token === "string" &&
        (typeof c.amount === "string" || typeof c.amount === "number");
}

/**
 * Template for extracting repay information
 */
const ariesRepayTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "token": "0x1::aptos_coin::AptosCoin",
    "amount": "100",
    "profileName": "Main account"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested Aries Protocol repayment operation:
- Token type (e.g., "0x1::aptos_coin::AptosCoin" for APT)
- Amount to repay
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
 * Repay tokens in Aries Protocol
 */
async function repayAriesToken(
    aptosClient: Aptos,
    account: Account,
    token: string,
    amount: number,
    profileName = "Main account"
): Promise<string> {
    try {
        const tokenName = getTokenDisplayName(token);
        elizaLogger.info(`Repaying ${amount} ${tokenName} on Aries Protocol for profile ${profileName}`);

        // Prepare transaction data
        const txData: InputGenerateTransactionPayloadData = {
            function: `${ARIES_CONTRACT_ADDRESS}::controller::repay`,
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
            throw new Error("Repay failed");
        }

        elizaLogger.info("Repay completed successfully");
        return signedTransaction.hash;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Repay failed: ${errorMessage}`);
    }
}

/**
 * Handler for ARIES_REPAY action
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
            template: ariesRepayTemplate,
        });
        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isAriesRepayContent(content)) {
            elizaLogger.error("Invalid content for ARIES_REPAY action.");
            callback?.({
                text: "Unable to process repayment request. Please provide token type and amount.",
                content: { action: "ARIES_REPAY", status: "error", error: "Invalid repay content" },
            });
            return false;
        }

        // Use default profile name if not specified
        const profileName = content.profileName || "Main account";
        const tokenName = getTokenDisplayName(content.token);

        // Send a confirmation message first
        callback?.({
            text: `Processing request to repay ${content.amount} ${tokenName} on Aries Protocol...`,
            content: {
                action: "ARIES_REPAY",
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

        // Repay tokens
        const hash = await repayAriesToken(
            aptosClient,
            account,
            content.token,
            Number(content.amount),
            profileName
        );

        // Format the response
        const response = [
            "# Loan Repaid Successfully on Aries Protocol",
            "",
            `**Token**: ${tokenName}`,
            `**Amount**: ${content.amount}`,
            `**Profile**: ${profileName}`,
            `**Transaction Hash**: \`${hash}\``,
            "",
            `You have successfully repaid ${content.amount} ${tokenName} on Aries Protocol.`,
            "This has improved your health factor and reduced your borrowing position."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "ARIES_REPAY",
                status: "complete",
                transactionHash: hash,
                token: content.token,
                amount: content.amount,
                profileName
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in ARIES_REPAY handler:", error);
        callback?.({
            text: `Failed to repay loan on Aries Protocol: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "ARIES_REPAY", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for repaying loans on Aries Protocol
 */
const ariesRepayAction: Action = {
    name: "ARIES_REPAY",
    description: "Repay loan on Aries Protocol",
    similes: [
        "REPAY_ARIES",
        "ARIES_REPAYMENT",
        "PAY_BACK_ARIES",
        "REPAY_LOAN_ARIES"
    ],
    examples: [
        [
            {
                user: "user",
                content: {
                    text: "Repay 30 APT on my Aries loan"
                }
            }
        ],
        [
            {
                user: "user",
                content: {
                    text: "Pay back 500 USDC to Aries"
                }
            }
        ]
    ],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("repay") ||
                messageText.includes("pay back") ||
                messageText.includes("payback")) &&
               messageText.includes("aries");
    },
    suppressInitialMessage: true
};

export default ariesRepayAction;
