import { elizaLogger } from "@elizaos/core";
import type {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    ModelClass,
    State,
    Action,
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    Account,
    Ed25519PrivateKey
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

export interface BorrowContent extends Content {
    token: string;
    amount: string;
}

function isBorrowContent(content: unknown): content is BorrowContent {
    elizaLogger.info("Content for Joule borrowing", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.token === "string" &&
           typeof c.amount === "string";
}

const borrowTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "token": "0x1::aptos_coin::AptosCoin",
    "amount": "10"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Borrows tokens from Joule Finance
 */
async function borrowFromJoule(
    aptosClient: Aptos,
    account: Account,
    token: string,
    amount: string
): Promise<string> {
    try {
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::router::borrow",
                functionArguments: [amount],
                typeArguments: [token],
            },
        });

        const committedTransactionHash = await account.signAndSubmitTransaction({
            transaction
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransactionHash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Joule borrow failed", signedTransaction);
            throw new Error("Joule borrow failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Joule borrow failed: ${error.message}`);
        }
        throw new Error("Joule borrow failed with unknown error");
    }
}

/**
 * Handler for the JOULE_BORROW action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract borrow parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            borrowTemplate,
            context,
            "function" as ModelClass,
            isBorrowContent
        );

        if (!content.token || !content.amount) {
            callback?.({
                text: "Please provide a token and amount to borrow from Joule Finance.",
                content: { action: "JOULE_BORROW", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Borrowing ${content.amount} of ${content.token} from Joule Finance...`,
            content: { action: "JOULE_BORROW", status: "pending" }
        });

        // Initialize Aptos client and account
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(config.APTOS_PRIVATE_KEY);
        const account = Account.fromPrivateKey({ privateKey });

        // Borrow from Joule
        const transactionHash = await borrowFromJoule(
            aptosClient,
            account,
            content.token,
            content.amount
        );

        // Format the response
        const response = [
            "# Joule Finance Borrow Successful",
            "",
            `**Token**: \`${content.token}\``,
            `**Amount**: ${content.amount}`,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "You have successfully borrowed from Joule Finance. Remember to monitor your collateral ratio to avoid liquidation."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "JOULE_BORROW",
                status: "complete",
                borrow: {
                    token: content.token,
                    amount: content.amount,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_BORROW handler:", error);
        callback?.({
            text: `Failed to borrow from Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_BORROW", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for borrowing from Joule Finance
 */
const borrowAction: Action = {
    name: "JOULE_BORROW",
    description: "Borrow tokens from Joule Finance",
    similes: [
        "BORROW_JOULE",
        "JOULE_LOAN",
        "TAKE_LOAN_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Borrow 10 USDC from Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Take a loan of 5 APT from Joule Finance"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "I want to borrow some tokens on Joule"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("borrow") ||
                messageText.includes("loan")) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default borrowAction;
