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
        elizaLogger.info(`Getting pool details for token: ${token}`);

        // Normalize token name/symbol for comparison
        const normalizedToken = token.toLowerCase();

        // Use the price-api.joule.finance endpoint as used in Move Agent Kit
        const allPoolDetailsResponse = await fetch("https://price-api.joule.finance/api/market");

        if (!allPoolDetailsResponse.ok) {
            throw new Error(`Failed to fetch pool details: ${allPoolDetailsResponse.statusText}`);
        }

        const allPoolDetails = await allPoolDetailsResponse.json();

        if (!allPoolDetails.data || !Array.isArray(allPoolDetails.data)) {
            throw new Error("Invalid response from Joule API");
        }

        elizaLogger.info(`Found ${allPoolDetails.data.length} pools in Joule API response`);

        // Find the pool that matches our token
        // We'll match by token type, name, or symbol
        const poolDetail = allPoolDetails.data.find((pool: Record<string, unknown>) => {
            if (!pool.asset) return false;

            const asset = pool.asset as Record<string, unknown>;

            // Check for matches in type, assetName, or symbol
            return (
                (typeof asset.type === 'string' && asset.type.toLowerCase().includes(normalizedToken)) ||
                (typeof asset.assetName === 'string' && asset.assetName.toLowerCase().includes(normalizedToken)) ||
                (typeof asset.symbol === 'string' && asset.symbol.toLowerCase() === normalizedToken)
            );
        });

        if (!poolDetail) {
            elizaLogger.warn(`Pool not found for token: ${token}`);
            throw new Error("Pool not found");
        }

        elizaLogger.info(`Found pool for ${token}: ${JSON.stringify(poolDetail)}`);

        const asset = poolDetail.asset as Record<string, unknown>;
        const decimals = typeof asset.decimals === 'number' ? asset.decimals : 8;

        // Format the response similar to Move Agent Kit's implementation
        return {
            token: typeof asset.type === 'string' ? asset.type : token,
            totalSupply: typeof poolDetail.marketSize === 'string' || typeof poolDetail.marketSize === 'number'
                ? String(Number(poolDetail.marketSize) / (10 ** decimals))
                : "0",
            totalBorrow: typeof poolDetail.totalBorrowed === 'string' || typeof poolDetail.totalBorrowed === 'number'
                ? String(Number(poolDetail.totalBorrowed) / (10 ** decimals))
                : "0",
            supplyApy: typeof poolDetail.depositApy === 'string' || typeof poolDetail.depositApy === 'number'
                ? String(poolDetail.depositApy)
                : "0",
            borrowApy: typeof poolDetail.borrowApy === 'string' || typeof poolDetail.borrowApy === 'number'
                ? String(poolDetail.borrowApy)
                : "0",
            utilizationRate: typeof poolDetail.utilization === 'string' || typeof poolDetail.utilization === 'number'
                ? String(poolDetail.utilization * 100) // Convert to percentage
                : "0",
            collateralFactor: typeof poolDetail.ltv === 'string' || typeof poolDetail.ltv === 'number'
                ? String(poolDetail.ltv * 100) // Convert to percentage
                : "80" // Default value
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
