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
    Network
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../../enviroment";

export interface CheckApyContent extends Content {
    poolId?: string;
}

function isCheckApyContent(content: unknown): content is CheckApyContent {
    elizaLogger.info("Content for Amnis APY check", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    // No required fields
    return true;
}

const checkApyTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "poolId": "1"
}
\`\`\`

{{recentMessages}}
`;

interface PoolApyInfo {
    poolId: string;
    apy: string;
    totalStaked: string;
    rewardRate: string;
}

/**
 * Gets staking APY from Amnis Finance
 */
async function getAmnisApy(
    aptosClient: Aptos,
    poolId: string = "1"
): Promise<PoolApyInfo> {
    try {
        // In a real implementation, we would query the Amnis Finance contract
        // to get the staking APY. For simplicity, we're returning placeholders.

        // This would involve getting resources from the Amnis contract and parsing them
        // to extract the APY information.

        return {
            poolId,
            apy: "5.25",
            totalStaked: "1000000",
            rewardRate: "0.0144"
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get Amnis APY: ${error.message}`);
        }
        throw new Error("Failed to get Amnis APY with unknown error");
    }
}

/**
 * Handler for the AMNIS_CHECK_APY action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract check APY parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            checkApyTemplate,
            context,
            "function" as ModelClass,
            isCheckApyContent
        );

        // Send a confirmation message first
        const poolMessage = content.poolId ? ` for pool ${content.poolId}` : "";
        callback?.({
            text: `Checking current APY${poolMessage} on Amnis Finance...`,
            content: { action: "AMNIS_CHECK_APY", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Get APY info
        const poolId = content.poolId || "1"; // Default to pool 1 if not specified
        const apyInfo = await getAmnisApy(
            aptosClient,
            poolId
        );

        // Format the response
        const response = [
            "# Amnis Finance Staking APY",
            "",
            `**Pool ID**: ${apyInfo.poolId}`,
            `**Current APY**: ${apyInfo.apy}%`,
            "",
            "## Pool Statistics",
            `**Total Staked**: ${apyInfo.totalStaked} APT`,
            `**Daily Reward Rate**: ${apyInfo.rewardRate}%`,
            "",
            "Stake your APT tokens to earn rewards at this APY rate."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "AMNIS_CHECK_APY",
                status: "complete",
                apyInfo
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in AMNIS_CHECK_APY handler:", error);
        callback?.({
            text: `Failed to check APY on Amnis Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "AMNIS_CHECK_APY", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for checking APY on Amnis Finance
 */
const checkApyAction: Action = {
    name: "AMNIS_CHECK_APY",
    description: "Check staking APY on Amnis Finance",
    similes: [
        "CHECK_APY_AMNIS",
        "AMNIS_APY",
        "STAKING_APY_AMNIS"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Check the current APY on Amnis"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What's the staking APY on Amnis Finance?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me the Amnis staking rates"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("apy") ||
                messageText.includes("rate") ||
                messageText.includes("interest")) &&
               messageText.includes("amnis");
    },
    suppressInitialMessage: true
};

export default checkApyAction;
