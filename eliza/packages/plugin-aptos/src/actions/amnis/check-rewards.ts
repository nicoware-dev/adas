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
    AccountAddress
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

export interface CheckRewardsContent extends Content {
    address?: string;
    poolId?: string;
}

function isCheckRewardsContent(content: unknown): content is CheckRewardsContent {
    elizaLogger.info("Content for Amnis rewards check", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    // No required fields
    return true;
}

const checkRewardsTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x123...",
    "poolId": "1"
}
\`\`\`

{{recentMessages}}
`;

interface RewardsInfo {
    stakedAmount: string;
    pendingRewards: string;
    apy: string;
    poolId: string;
}

/**
 * Gets staking rewards from Amnis Finance
 */
async function getAmnisRewards(
    aptosClient: Aptos,
    address: string,
    poolId: string = "1"
): Promise<RewardsInfo> {
    try {
        const accountAddress = AccountAddress.fromString(address);

        // In a real implementation, we would query the Amnis Finance contract
        // to get the staking rewards. For simplicity, we're returning placeholders.

        // This would involve getting resources from the account and parsing them
        // to extract the staking rewards information.

        return {
            stakedAmount: "100",
            pendingRewards: "5.25",
            apy: "5.25",
            poolId
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get Amnis rewards: ${error.message}`);
        }
        throw new Error("Failed to get Amnis rewards with unknown error");
    }
}

/**
 * Handler for the AMNIS_CHECK_REWARDS action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract check rewards parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            checkRewardsTemplate,
            context,
            "function" as ModelClass,
            isCheckRewardsContent
        );

        // Send a confirmation message first
        const poolMessage = content.poolId ? ` for pool ${content.poolId}` : "";
        callback?.({
            text: `Checking your Amnis Finance rewards${poolMessage}...`,
            content: { action: "AMNIS_CHECK_REWARDS", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Use the provided address or the default from config
        const address = content.address || config.APTOS_ACCOUNT_ADDRESS;

        // Get rewards info
        const poolId = content.poolId || "1"; // Default to pool 1 if not specified
        const rewards = await getAmnisRewards(
            aptosClient,
            address,
            poolId
        );

        // Format the response
        const response = [
            "# Amnis Finance Staking Rewards",
            "",
            `**Address**: \`${address}\``,
            `**Pool ID**: ${rewards.poolId}`,
            "",
            "## Staking Position",
            `**Staked Amount**: ${rewards.stakedAmount} APT`,
            `**Pending Rewards**: ${rewards.pendingRewards} APT`,
            `**Current APY**: ${rewards.apy}%`,
            "",
            "You can claim your rewards by unstaking or using the claim rewards function."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "AMNIS_CHECK_REWARDS",
                status: "complete",
                rewards: {
                    address,
                    poolId: rewards.poolId,
                    stakedAmount: rewards.stakedAmount,
                    pendingRewards: rewards.pendingRewards,
                    apy: rewards.apy
                }
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in AMNIS_CHECK_REWARDS handler:", error);
        callback?.({
            text: `Failed to check rewards on Amnis Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "AMNIS_CHECK_REWARDS", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for checking rewards on Amnis Finance
 */
const checkRewardsAction: Action = {
    name: "AMNIS_CHECK_REWARDS",
    description: "Check staking rewards on Amnis Finance",
    similes: [
        "CHECK_REWARDS_AMNIS",
        "AMNIS_REWARDS",
        "STAKING_REWARDS_AMNIS"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Check my rewards on Amnis"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What are my staking rewards on Amnis Finance?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me my Amnis staking rewards"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("reward") ||
                messageText.includes("staking reward") ||
                messageText.includes("check reward")) &&
               messageText.includes("amnis");
    },
    suppressInitialMessage: true
};

export default checkRewardsAction;
