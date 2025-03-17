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

export interface UnstakeContent extends Content {
    amount: string;
    poolId?: string;
}

function isUnstakeContent(content: unknown): content is UnstakeContent {
    elizaLogger.info("Content for Amnis unstaking", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.amount === "string";
}

const unstakeTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "amount": "10",
    "poolId": "1"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Unstakes tokens from Amnis Finance
 */
async function unstakeFromAmnis(
    aptosClient: Aptos,
    account: Account,
    amount: string,
    poolId: string = "1"
): Promise<string> {
    try {
        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a::router::unstake_entry",
                functionArguments: [amount, account.accountAddress.toString()],
                typeArguments: [],
            },
        });

        const committedTransactionHash = await account.signAndSubmitTransaction({
            transaction
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransactionHash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Amnis unstaking failed", signedTransaction);
            throw new Error("Amnis unstaking failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Amnis unstaking failed: ${error.message}`);
        }
        throw new Error("Amnis unstaking failed with unknown error");
    }
}

/**
 * Handler for the AMNIS_UNSTAKE action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract unstake parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            unstakeTemplate,
            context,
            "function" as ModelClass,
            isUnstakeContent
        );

        if (!content.amount) {
            callback?.({
                text: "Please provide an amount to unstake from Amnis Finance.",
                content: { action: "AMNIS_UNSTAKE", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        const poolMessage = content.poolId ? ` from pool ${content.poolId}` : "";
        callback?.({
            text: `Unstaking ${content.amount} APT${poolMessage} from Amnis Finance...`,
            content: { action: "AMNIS_UNSTAKE", status: "pending" }
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

        // Unstake from Amnis
        const poolId = content.poolId || "1"; // Default to pool 1 if not specified
        const transactionHash = await unstakeFromAmnis(
            aptosClient,
            account,
            content.amount,
            poolId
        );

        // Format the response
        const response = [
            "# Amnis Finance Unstaking Successful",
            "",
            `**Amount Unstaked**: ${content.amount} APT`,
            content.poolId ? `**Pool ID**: ${content.poolId}` : "",
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "You have successfully unstaked your tokens from Amnis Finance."
        ].filter(Boolean).join("\n");

        callback?.({
            text: response,
            content: {
                action: "AMNIS_UNSTAKE",
                status: "complete",
                unstake: {
                    amount: content.amount,
                    poolId: poolId,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in AMNIS_UNSTAKE handler:", error);
        callback?.({
            text: `Failed to unstake from Amnis Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "AMNIS_UNSTAKE", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for unstaking from Amnis Finance
 */
const unstakeAction: Action = {
    name: "AMNIS_UNSTAKE",
    description: "Unstake tokens from Amnis Finance",
    similes: [
        "UNSTAKE_AMNIS",
        "AMNIS_UNSTAKING",
        "WITHDRAW_AMNIS"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Unstake 10 APT from Amnis"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Withdraw my staked tokens from Amnis Finance"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "I want to unstake my APT from Amnis"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("unstake") ||
                messageText.includes("withdraw") ||
                messageText.includes("remove stake")) &&
               messageText.includes("amnis");
    },
    suppressInitialMessage: true
};

export default unstakeAction;
