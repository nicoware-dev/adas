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

export interface ClaimRewardContent extends Content {
    token?: string;
}

function isClaimRewardContent(content: unknown): content is ClaimRewardContent {
    elizaLogger.info("Content for Joule reward claiming", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return true; // No required fields, token is optional
}

const claimRewardTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "token": "0x1::aptos_coin::AptosCoin"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Claims rewards from Joule Finance
 */
async function claimJouleRewards(
    aptosClient: Aptos,
    account: Account,
    token?: string
): Promise<string> {
    try {
        // If token is specified, claim rewards for that specific token
        // Otherwise, claim all rewards
        const functionArguments = token ? [token] : [];
        const typeArguments = token ? [token] : [];

        const transaction = await aptosClient.transaction.build.simple({
            sender: account.accountAddress,
            data: {
                function: "0xc7efb4076dbe143cbcd98cfaaa929ecfc8f299203dfff63b95ccb6bfe19850fa::router::claim_rewards",
                functionArguments,
                typeArguments,
            },
        });

        const committedTransactionHash = await account.signAndSubmitTransaction({
            transaction
        });

        const signedTransaction = await aptosClient.waitForTransaction({
            transactionHash: committedTransactionHash,
        });

        if (!signedTransaction.success) {
            elizaLogger.error("Joule reward claiming failed", signedTransaction);
            throw new Error("Joule reward claiming failed");
        }

        return signedTransaction.hash;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Joule reward claiming failed: ${error.message}`);
        }
        throw new Error("Joule reward claiming failed with unknown error");
    }
}

/**
 * Handler for the JOULE_CLAIM_REWARD action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract claim reward parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            claimRewardTemplate,
            context,
            "function" as ModelClass,
            isClaimRewardContent
        );

        // Send a confirmation message first
        const tokenMessage = content.token ? ` for ${content.token}` : "";
        callback?.({
            text: `Claiming rewards${tokenMessage} from Joule Finance...`,
            content: { action: "JOULE_CLAIM_REWARD", status: "pending" }
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

        // Claim rewards
        const transactionHash = await claimJouleRewards(
            aptosClient,
            account,
            content.token
        );

        // Format the response
        const tokenInfo = content.token ? `for \`${content.token}\`` : "for all tokens";
        const response = [
            "# Joule Finance Rewards Claimed Successfully",
            "",
            `**Rewards Claimed**: ${tokenInfo}`,
            `**Transaction Hash**: \`${transactionHash}\``,
            "",
            "You have successfully claimed your rewards from Joule Finance."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "JOULE_CLAIM_REWARD",
                status: "complete",
                claimReward: {
                    token: content.token,
                    transactionHash
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_CLAIM_REWARD handler:", error);
        callback?.({
            text: `Failed to claim rewards from Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_CLAIM_REWARD", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for claiming rewards on Joule Finance
 */
const claimRewardAction: Action = {
    name: "JOULE_CLAIM_REWARD",
    description: "Claim rewards from Joule Finance",
    similes: [
        "CLAIM_REWARD_JOULE",
        "JOULE_REWARDS",
        "GET_REWARDS_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Claim my rewards from Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Claim APT rewards on Joule Finance"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "I want to get my Joule rewards"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("claim") ||
                messageText.includes("get reward") ||
                messageText.includes("collect reward")) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default claimRewardAction;
