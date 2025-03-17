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

export interface WithdrawContent extends Content {
    token: string;
    amount: string;
}

function isWithdrawContent(content: unknown): content is WithdrawContent {
    elizaLogger.info("Content for Joule withdrawal", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.token === "string" &&
           typeof c.amount === "string";
}

const withdrawTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

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
 * Withdraws tokens from Joule Finance
 */
async function withdrawFromJoule(
    aptosClient: Aptos,
    account: Account,
    token: string,
    amount: string
): Promise<string> {
    try {
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::router::withdraw",
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
            elizaLogger.error("Joule withdrawal failed", signedTransaction);
            throw new Error("Joule withdrawal failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Joule withdrawal failed: ${error.message}`);
        }
        throw new Error("Joule withdrawal failed with unknown error");
    }
}

/**
 * Handler for the JOULE_WITHDRAW action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract withdraw parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            withdrawTemplate,
            context,
            "function" as ModelClass,
            isWithdrawContent
        );

        if (!content.token || !content.amount) {
            callback?.({
                text: "Please provide a token and amount to withdraw from Joule Finance.",
                content: { action: "JOULE_WITHDRAW", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Withdrawing ${content.amount} of ${content.token} from Joule Finance...`,
            content: { action: "JOULE_WITHDRAW", status: "pending" }
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

        // Withdraw from Joule
        const transactionHash = await withdrawFromJoule(
            aptosClient,
            account,
            content.token,
            content.amount
        );

        // Format the response
        const response = [
            "# Joule Finance Withdrawal Successful",
            "",
            `**Token**: \`${content.token}\``,
            `**Amount Withdrawn**: ${content.amount}`,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "You have successfully withdrawn your funds from Joule Finance."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "JOULE_WITHDRAW",
                status: "complete",
                withdraw: {
                    token: content.token,
                    amount: content.amount,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_WITHDRAW handler:", error);
        callback?.({
            text: `Failed to withdraw from Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_WITHDRAW", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for withdrawing from Joule Finance
 */
const withdrawAction: Action = {
    name: "JOULE_WITHDRAW",
    description: "Withdraw tokens from Joule Finance",
    similes: [
        "WITHDRAW_JOULE",
        "JOULE_WITHDRAWAL",
        "REMOVE_FUNDS_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Withdraw 10 USDC from Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Take out my 5 APT from Joule Finance"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "I want to withdraw my deposits from Joule"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("withdraw") ||
                messageText.includes("take out") ||
                messageText.includes("remove funds")) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default withdrawAction;
