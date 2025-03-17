import { elizaLogger } from "@elizaos/core";
import type {
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

export interface AllPoolsContent extends Content {
    // No specific parameters needed for this action
}

function isAllPoolsContent(content: unknown): content is AllPoolsContent {
    elizaLogger.info("Content for Joule all pools", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    // No specific fields to validate
    return true;
}

const allPoolsTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{}
\`\`\`

{{recentMessages}}
`;

interface PoolInfo {
    token: string;
    symbol: string;
    totalSupply: string;
    totalBorrow: string;
    supplyApy: string;
    borrowApy: string;
    utilizationRate: string;
}

/**
 * Gets all pools from Joule Finance
 */
async function getJouleAllPools(
    aptosClient: Aptos
): Promise<PoolInfo[]> {
    try {
        // In a real implementation, we would query the Joule Finance contract
        // to get all pools. For simplicity, we're returning placeholders.

        // This would involve getting resources from the Joule contract and parsing them
        // to extract all available pools.

        return [
            {
                token: "0x1::aptos_coin::AptosCoin",
                symbol: "APT",
                totalSupply: "1000000",
                totalBorrow: "500000",
                supplyApy: "2.5",
                borrowApy: "5.0",
                utilizationRate: "50"
            },
            {
                token: "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T",
                symbol: "USDC",
                totalSupply: "5000000",
                totalBorrow: "2000000",
                supplyApy: "3.2",
                borrowApy: "6.5",
                utilizationRate: "40"
            },
            {
                token: "0x8d87a65ba30e09357fa2edea2c80dbac296e5dec2b18287113500b902942929d::celer_coin_manager::UsdtCoin",
                symbol: "USDT",
                totalSupply: "4500000",
                totalBorrow: "1800000",
                supplyApy: "3.0",
                borrowApy: "6.2",
                utilizationRate: "40"
            }
        ];
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get Joule all pools: ${error.message}`);
        }
        throw new Error("Failed to get Joule all pools with unknown error");
    }
}

/**
 * Handler for the JOULE_ALL_POOLS action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract parameters from message (none needed for this action)
        const context = composeContext(runtime, message, state);
        await generateObjectDeprecated(
            runtime,
            allPoolsTemplate,
            context,
            "function" as ModelClass,
            isAllPoolsContent
        );

        // Send a confirmation message first
        callback?.({
            text: "Fetching all pools on Joule Finance...",
            content: { action: "JOULE_ALL_POOLS", status: "pending" }
        });

        // Initialize Aptos client
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Get all pools
        const pools = await getJouleAllPools(aptosClient);

        // Format the response
        const poolsTable = pools.map(pool => {
            return `| ${pool.symbol} | ${pool.totalSupply} | ${pool.totalBorrow} | ${pool.supplyApy}% | ${pool.borrowApy}% | ${pool.utilizationRate}% |`;
        }).join("\n");

        const response = [
            "# Joule Finance Pools",
            "",
            "| Token | Total Supply | Total Borrow | Supply APY | Borrow APY | Utilization |",
            "| ----- | ------------ | ------------ | ---------- | ---------- | ----------- |",
            poolsTable,
            "",
            "## Pool Details",
            "For more information about a specific pool, ask about pool details for a specific token."
        ].join("\n");

        callback?.({
            text: response,
            content: {
                action: "JOULE_ALL_POOLS",
                status: "complete",
                pools
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in JOULE_ALL_POOLS handler:", error);
        callback?.({
            text: `Failed to get all pools from Joule Finance: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "JOULE_ALL_POOLS", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting all pools on Joule Finance
 */
const allPoolsAction: Action = {
    name: "JOULE_ALL_POOLS",
    description: "Get all pools on Joule Finance",
    similes: [
        "ALL_POOLS_JOULE",
        "JOULE_POOLS",
        "LIST_POOLS_JOULE"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Show me all pools on Joule"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What pools are available on Joule Finance?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "List all Joule pools"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("all pool") ||
                messageText.includes("list pool") ||
                (messageText.includes("pool") && messageText.includes("available"))) &&
               messageText.includes("joule");
    },
    suppressInitialMessage: true
};

export default allPoolsAction;
