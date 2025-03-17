import type { Action, Handler } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import { getTrendingPools } from "../../api/client";
import { formatPoolMarkdownConcise, formatPoolInfo, formatCurrency } from "../../utils/format";
import { SUPPORTED_NETWORKS } from "../../config/networks";
import { Pool } from "../../types";
import { extractLimit } from "../../../defillama/utils/extract";

const DEFAULT_LIMIT = 5;

const handler: Handler = async (runtime, message, state, _options, callback) => {
    try {
        const messageText = message.content?.text?.toLowerCase() || "";

        // Extract network from message if specified
        const networkId = SUPPORTED_NETWORKS.find(n =>
            messageText.includes(n.id) || messageText.includes(n.name.toLowerCase())
        )?.id;

        // Extract limit from message (default to 5)
        const limit = extractLimit(messageText) || DEFAULT_LIMIT;

        elizaLogger.debug('Trending pools request:', {
            messageText,
            extractedNetwork: networkId,
            limit
        });

        // Fetch trending pools
        const result = await getTrendingPools(networkId);
        if (!result.success || !result.result) {
            callback?.({
                text: `Failed to get trending pools: ${result.error?.message || 'No pools found'}`
            });
            return false;
        }

        // Generate markdown report
        let markdown = networkId
            ? `# Top ${limit} Pools on ${SUPPORTED_NETWORKS.find(n => n.id === networkId)?.name}\n\n`
            : `# Top ${limit} Pools\n\n`;

        if (result.result.length === 0) {
            markdown += "_No trending pools found at the moment._";
        } else {
            // Get pools and limit the number
            const pools = Array.isArray(result.result) ? result.result.slice(0, limit) : [result.result];

            // Calculate total TVL and volume
            const totalTVL = pools.reduce((sum, pool) => {
                const tvl = parseFloat(pool.attributes.reserve_in_usd) || 0;
                return sum + tvl;
            }, 0);

            const totalVolume = pools.reduce((sum, pool) => {
                const volume = parseFloat(pool.attributes.volume_usd.h24) || 0;
                return sum + volume;
            }, 0);

            // Add summary statistics
            markdown += `**Total TVL**: ${formatCurrency(totalTVL)}\n`;
            markdown += `**24h Volume**: ${formatCurrency(totalVolume)}\n\n`;

            // Add each pool with concise information
            markdown += pools.map((pool: Pool, index: number) => {
                const poolInfo = formatPoolInfo(pool);
                return `## ${index + 1}. ${poolInfo.name}\n` +
                       `- **TVL**: ${formatCurrency(poolInfo.tvl)}\n` +
                       `- **24h Volume**: ${formatCurrency(poolInfo.volume24h)}\n` +
                       (poolInfo.priceChange24h && poolInfo.priceChange24h !== 'N/A'
                           ? `- **24h Price Change**: ${poolInfo.priceChange24h}\n`
                           : '') +
                       (poolInfo.baseTokenName && poolInfo.quoteTokenName
                           ? `- **Token Prices**: ${poolInfo.baseTokenName}: ${formatCurrency(poolInfo.baseTokenPrice)}, ${poolInfo.quoteTokenName}: ${formatCurrency(poolInfo.quoteTokenPrice)}\n`
                           : '');
            }).join('\n');
        }

        callback?.({
            text: markdown,
            content: {
                action: "GET_TRENDING_POOLS",
                status: "complete",
                pools: result.result.slice(0, limit),
                totalCount: result.result.length
            }
        });

        return true;

    } catch (error) {
        elizaLogger.error('Error in GET_TRENDING_POOLS handler:', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        callback?.({
            text: "Sorry, I encountered an error while fetching trending pools. " +
                 "Please try again in a moment."
        });
        return false;
    }
};

export const trendingPoolsAction: Action = {
    name: 'GET_TRENDING_POOLS',
    description: 'Get trending pools across all networks or for a specific network',
    similes: [
        'TRENDING_POOLS',
        'HOT_POOLS',
        'POPULAR_POOLS',
        'TOP_TRENDING',
        'MOST_ACTIVE_POOLS',
        'TRENDING_DEX_POOLS'
    ],
    handler,
    suppressInitialMessage: true,
    validate: async () => true,
    examples: [[
        {
            user: 'user',
            content: { text: "Show me trending pools" }
        }
    ], [
        {
            user: 'user',
            content: { text: "What are the hottest pools right now?" }
        }
    ], [
        {
            user: 'user',
            content: { text: "Show trending pools on Aptos" }
        }
    ], [
        {
            user: 'user',
            content: { text: "Which pools are trending today?" }
        }
    ]]
};
