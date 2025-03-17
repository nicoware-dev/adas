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

export interface RepayContent extends Content {
    token: string;
    amount: string;
}

function isRepayContent(content: unknown): content is RepayContent {
    elizaLogger.info("Content for Joule repayment", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.token === "string" &&
           typeof c.amount === "string";
}

const repayTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

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
 * Repays a loan on Joule Finance
 */
async function repayJouleLoan(
    aptosClient: Aptos,
    account: Account,
    token: string,
    amount: string
): Promise<string> {
    try {
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::router::repay",
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
            elizaLogger.error("Joule repayment failed", signedTransaction);
            throw new Error("Joule repayment failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Joule repayment failed: ${error.message}`);
        }
        throw new Error("Joule repayment failed with unknown error");
    }
}

/**
 * Handler for the JOULE_REPAY action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract repay parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            repayTemplate,
            context,
            "function" as ModelClass,
            isRepayContent
        );

        if (!content.token || !content.amount) {
            callback?.({
                text: "Please provide a token and amount to repay on Joule Finance.",
                content: { action: "JOULE_REPAY", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Repaying ${content.amount} of ${content.token} on Joule Finance...`,
            content: { action: "JOULE_REPAY", status: "pending" }
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

        // Repay the loan
        const transactionHash = await repayJouleLoan(
            aptosClient,
            account,
            content.token,
            content.amount
        );

        // Format the response
        const response = [
            "# Joule Finance Repayment Successful",
            "",
            `**Token**: \`${content.token}\``,
            `**Amount Repaid**: ${content.amount}`,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "You have successfully repaid your loan on Joule Finance."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "JOULE_REPAY",
                status: "complete",
                repay: {
                    token: content.token,
                    amount: content.amount,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_REPAY handler:", error);
        callback?.({
            text: `Failed to repay loan on Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_REPAY", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for repaying loans on Joule Finance
 */
const repayAction: Action = {
    name: "JOULE_REPAY",
    description: "Repay a loan on Joule Finance",
    similes: [
        "REPAY_JOULE",
        "JOULE_REPAYMENT",
        "PAY_LOAN_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Repay 10 USDC on Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Pay back my 5 APT loan on Joule Finance"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "I want to repay my Joule loan"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("repay") ||
                messageText.includes("pay back") ||
                messageText.includes("pay off")) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default repayAction;
