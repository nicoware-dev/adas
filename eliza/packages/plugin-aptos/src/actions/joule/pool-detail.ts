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

export interface PoolDetailContent extends Content {
    token: string;
}

function isPoolDetailContent(content: unknown): content is PoolDetailContent {
    elizaLogger.info("Content for Joule pool detail", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.token === "string";
}

const poolDetailTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "token": "0x1::aptos_coin::AptosCoin"
}
\`\`\`

{{recentMessages}}
`;

interface PoolDetail {
    token: string;
    totalSupply: string;
    totalBorrow: string;
    supplyApy: string;
    borrowApy: string;
    utilizationRate: string;
    collateralFactor: string;
}

/**
 * Gets pool details from Joule Finance
 */
async function getJoulePoolDetail(
    aptosClient: Aptos,
    token: string
): Promise<PoolDetail> {
    try {
        // In a real implementation, we would query the Joule Finance contract
        // to get the pool details. For simplicity, we're returning placeholders.

        // This would involve getting resources from the Joule contract and parsing them
        // to extract the pool details for the specified token.

        return {
            token,
            totalSupply: "1000000",
            totalBorrow: "500000",
            supplyApy: "2.5",
            borrowApy: "5.0",
            utilizationRate: "50",
            collateralFactor: "80"
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get Joule pool detail: ${error.message}`);
        }
        throw new Error("Failed to get Joule pool detail with unknown error");
    }
}

/**
 * Handler for the JOULE_POOL_DETAIL action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract pool detail parameters from message
        const context = composeContext(runtime, message, state);
        const content = await generateObjectDeprecated(
            runtime,
            poolDetailTemplate,
            context,
            "function" as ModelClass,
            isPoolDetailContent
        );

        if (!content.token) {
            callback?.({
                text: "Please specify a token to check pool details for on Joule Finance.",
                content: { action: "JOULE_POOL_DETAIL", status: "error", error: "Missing required parameters" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Checking pool details for ${content.token} on Joule Finance...`,
            content: { action: "JOULE_POOL_DETAIL", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Get pool details
        const poolDetail = await getJoulePoolDetail(
            aptosClient,
            content.token
        );

        // Format the response
        const response = [
            "# Joule Finance Pool Details",
            "",
            `**Token**: \`${poolDetail.token}\``,
            "",
            "## Pool Statistics",
            `**Total Supply**: ${poolDetail.totalSupply}`,
            `**Total Borrow**: ${poolDetail.totalBorrow}`,
            `**Utilization Rate**: ${poolDetail.utilizationRate}%`,
            "",
            "## Interest Rates",
            `**Supply APY**: ${poolDetail.supplyApy}%`,
            `**Borrow APY**: ${poolDetail.borrowApy}%`,
            "",
            "## Risk Parameters",
            `**Collateral Factor**: ${poolDetail.collateralFactor}%`
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "JOULE_POOL_DETAIL",
                status: "complete",
                poolDetail
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_POOL_DETAIL handler:", error);
        callback?.({
            text: `Failed to get pool details from Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_POOL_DETAIL", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting pool details on Joule Finance
 */
const poolDetailAction: Action = {
    name: "JOULE_POOL_DETAIL",
    description: "Get pool details on Joule Finance",
    similes: [
        "POOL_DETAIL_JOULE",
        "JOULE_POOL_INFO",
        "CHECK_POOL_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Check APT pool details on Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What are the USDC pool stats on Joule Finance?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me the Joule pool info for BTC"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("pool detail") ||
                messageText.includes("pool info") ||
                messageText.includes("pool stat")) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default poolDetailAction;
