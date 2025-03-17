import { elizaLogger } from "@elizaos/core";
import type {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    Action,
} from "@elizaos/core";
import { composeContext, generateObjectDeprecated, ModelClass } from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    type TransactionResponse,
    UserTransactionResponse
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";

export interface TransactionContent extends Content {
    transactionHash: string;
}

function isTransactionContent(content: unknown): content is TransactionContent {
    elizaLogger.info("Content for transaction lookup", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.transactionHash === "string";
}

const transactionTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "transactionHash": "0x123..."
}
\`\`\`

{{recentMessages}}
`;

/**
 * Gets transaction information from the Aptos blockchain
 */
async function getTransaction(aptosClient: Aptos, hash: string): Promise<TransactionResponse> {
    try {
        const transaction = await aptosClient.getTransactionByHash({
            transactionHash: hash,
        });

        return transaction;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get transaction: ${error.message}`);
        }
        throw new Error("Failed to get transaction with unknown error");
    }
}

/**
 * Formats a transaction response into a readable string
 */
function formatTransaction(transaction: TransactionResponse): string {
    if (!transaction) {
        return "Transaction not found";
    }

    const sections = ["# Transaction Details", ""];

    // Basic transaction info
    sections.push(`**Hash**: \`${transaction.hash}\``);
    sections.push(`**Type**: ${transaction.type}`);
    sections.push(`**Success**: ${transaction.success ? "Yes" : "No"}`);
    sections.push(`**VM Status**: ${transaction.vm_status}`);
    sections.push("");

    // User transaction specific details
    if (transaction.type === "user_transaction") {
        const userTx = transaction as UserTransactionResponse;
        sections.push(`**Sender**: \`${userTx.sender}\``);
        sections.push(`**Sequence Number**: ${userTx.sequence_number}`);
        sections.push(`**Gas Used**: ${userTx.gas_used}`);
        sections.push(`**Gas Unit Price**: ${userTx.gas_unit_price}`);
        sections.push(`**Max Gas Amount**: ${userTx.max_gas_amount}`);
        sections.push("");

        // Payload details
        if (userTx.payload?.type === "entry_function_payload") {
            sections.push("## Function Call");
            sections.push(`**Function**: \`${userTx.payload.function}\``);

            if (userTx.payload.type_arguments && userTx.payload.type_arguments.length > 0) {
                sections.push("**Type Arguments**:");
                userTx.payload.type_arguments.forEach(arg => {
                    sections.push(`- \`${arg}\``);
                });
            }

            if (userTx.payload.arguments && userTx.payload.arguments.length > 0) {
                sections.push("**Arguments**:");
                userTx.payload.arguments.forEach(arg => {
                    sections.push(`- \`${JSON.stringify(arg)}\``);
                });
            }
        }
    }

    // Events
    if (transaction.events && transaction.events.length > 0) {
        sections.push("");
        sections.push("## Events");

        transaction.events.slice(0, 5).forEach((event, index) => {
            sections.push(`### Event ${index + 1}`);
            sections.push(`**Type**: \`${event.type}\``);
            sections.push(`**Data**: \`${JSON.stringify(event.data).substring(0, 100)}${JSON.stringify(event.data).length > 100 ? '...' : ''}\``);
            sections.push("");
        });

        if (transaction.events.length > 5) {
            sections.push(`... and ${transaction.events.length - 5} more events`);
        }
    }

    return sections.join("\n");
}

/**
 * Handler for the GET_TRANSACTION action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract transaction hash from message
        const context = composeContext({
            state,
            template: transactionTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isTransactionContent(content)) {
            callback?.({
                text: "Please provide a transaction hash to look up.",
                content: { action: "GET_TRANSACTION", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Looking up transaction ${content.transactionHash}...`,
            content: { action: "GET_TRANSACTION", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Get transaction information
        const transaction = await getTransaction(
            aptosClient,
            content.transactionHash
        );

        // Format the transaction
        const formattedTransaction = formatTransaction(transaction);

        callback?.({
            text: formattedTransaction,
            content: {
                action: "GET_TRANSACTION",
                status: "complete",
                transaction: {
                    hash: transaction.hash,
                    success: transaction.success,
                    type: transaction.type,
                    vmStatus: transaction.vm_status
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in GET_TRANSACTION handler:", error);
        callback?.({
            text: `Failed to get transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "GET_TRANSACTION", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting transaction information
 */
const getTransactionAction: Action = {
    name: "GET_TRANSACTION",
    description: "Get transaction information from the Aptos blockchain",
    similes: [
        "TRANSACTION_INFO",
        "LOOKUP_TRANSACTION",
        "CHECK_TRANSACTION",
        "TX_INFO"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Get transaction info for 0x123..."
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Look up transaction 0x456..."
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me the details for tx 0x789..."
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("transaction") ||
                messageText.includes("tx")) &&
               (messageText.includes("get") ||
                messageText.includes("show") ||
                messageText.includes("details") ||
                messageText.includes("info") ||
                messageText.includes("lookup") ||
                messageText.includes("look up"));
    },
    suppressInitialMessage: true
};

export default getTransactionAction;
