import type { Action, Handler } from "@elizaos/core";
import { elizaLogger } from "@elizaos/core";
import { getTopPools } from "../../api/client";
import { formatCurrency, formatPoolInfo } from "../../utils/format";
import { SUPPORTED_NETWORKS } from "../../config/networks";
import { Pool } from "../../types";

// Add a validate function that matches the Validator type from @elizaos/core
const validate = async (_runtime: unknown, message: { content?: { text?: string } }, _state: unknown): Promise<boolean> => {
    const messageText = message.content?.text?.toLowerCase() || "";
    return messageText.includes("pool") ||
           messageText.includes("pools") ||
           messageText.includes("liquidity") ||
           messageText.includes("volume") ||
           messageText.includes("trading pairs");
};

const handler: Handler = async (runtime, message, state, _options, callback) => {
    try {
        const messageText = message.content?.text?.toLowerCase() || "";

        // Extract network from message if specified
        const networkId = SUPPORTED_NETWORKS.find(n =>
            messageText.includes(n.id) || messageText.includes(n.name.toLowerCase())
        )?.id;

        // Extract limit from message (default to 5)
        const limitMatch = messageText.match(/top\s+(\d+)|(\d+)\s+pools/i);
        const limit = limitMatch ? Number.parseInt(limitMatch[1] || limitMatch[2], 10) : 5;

        // Send a confirmation message first
        callback?.({
            text: `Fetching the top ${limit} pools${networkId ? ` on ${SUPPORTED_NETWORKS.find(n => n.id === networkId)?.name}` : ''}...`,
            content: { action: "GET_TOP_POOLS", status: "pending" }
        });

        elizaLogger.debug('Top pools request:', {
            messageText,
            extractedNetwork: networkId,
            limit
        });

        // Fetch top pools
        const result = await getTopPools(networkId, limit);
        if (!result.success || !result.result) {
            callback?.({
                text: `Failed to get top pools: ${result.error?.message || 'No pools found'}`,
                content: { action: "GET_TOP_POOLS", status: "error", error: result.error }
            });
            return false;
        }

        // Get pools and limit the number
        const pools = Array.isArray(result.result) ? result.result.slice(0, limit) : [];

        if (pools.length === 0) {
            callback?.({
                text: "No pools found at the moment.",
                content: { action: "GET_TOP_POOLS", status: "complete", pools: [] }
            });
            return true;
        }

        // Debug log to see the structure of the first pool
        elizaLogger.debug('First pool data:', JSON.stringify(pools[0], null, 2));

        // Calculate total TVL and volume
        const totalTVL = pools.reduce((sum, pool) => sum + (Number.parseFloat(pool.attributes.reserve_in_usd) || 0), 0);
        const totalVolume = pools.reduce((sum, pool) => sum + (Number.parseFloat(pool.attributes.volume_usd.h24) || 0), 0);

        // Generate concise report
        let response = networkId
            ? `# Top ${pools.length} Pools on ${SUPPORTED_NETWORKS.find(n => n.id === networkId)?.name}\n\n`
            : `# Top ${pools.length} Pools\n\n`;

        // Add summary statistics
        response += `**Total TVL**: ${formatCurrency(totalTVL)}\n`;
        response += `**24h Volume**: ${formatCurrency(totalVolume)}\n\n`;

        // Add each pool with concise information
        pools.forEach((pool, index) => {
            // Extract token names safely with fallbacks
            const baseTokenName = pool.attributes.base_token_name ||
                                 pool.attributes.name?.split('/')[0]?.trim() ||
                                 'Unknown';
            const quoteTokenName = pool.attributes.quote_token_name ||
                                  pool.attributes.name?.split('/')[1]?.trim() ||
                                  'Unknown';

            const pairName = `${baseTokenName} / ${quoteTokenName}`;

            response += `## ${index + 1}. ${pairName}\n`;
            response += `- **TVL**: ${formatCurrency(Number.parseFloat(pool.attributes.reserve_in_usd) || 0)}\n`;
            response += `- **24h Volume**: ${formatCurrency(Number.parseFloat(pool.attributes.volume_usd.h24) || 0)}\n`;

            if (pool.attributes.price_change_percentage?.h24) {
                const changeValue = Number.parseFloat(pool.attributes.price_change_percentage.h24);
                const changeDirection = changeValue >= 0 ? '+' : '';
                response += `- **24h Price Change**: ${changeDirection}${changeValue.toFixed(2)}%\n`;
            }

            if (pool.attributes.base_token_price_usd && pool.attributes.quote_token_price_usd) {
                response += `- **Token Prices**: ${baseTokenName}: ${formatCurrency(Number.parseFloat(pool.attributes.base_token_price_usd))}, ${quoteTokenName}: ${formatCurrency(Number.parseFloat(pool.attributes.quote_token_price_usd))}\n`;
            }

            response += '\n';
        });

        // Add note for more details
        response += "To see more details about a specific pool, ask about it by name (e.g., 'Tell me about the APT/USDC pool')";

        callback?.({
            text: response,
            content: {
                action: "GET_TOP_POOLS",
                status: "complete",
                pools: pools.map(pool => {
                    // Extract token names safely with fallbacks
                    const baseTokenName = pool.attributes.base_token_name ||
                                         pool.attributes.name?.split('/')[0]?.trim() ||
                                         'Unknown';
                    const quoteTokenName = pool.attributes.quote_token_name ||
                                          pool.attributes.name?.split('/')[1]?.trim() ||
                                          'Unknown';

                    return {
                        id: pool.id,
                        name: `${baseTokenName} / ${quoteTokenName}`,
                        tvl: Number.parseFloat(pool.attributes.reserve_in_usd) || 0,
                        volume24h: Number.parseFloat(pool.attributes.volume_usd.h24) || 0,
                        priceChange24h: pool.attributes.price_change_percentage?.h24 ? Number.parseFloat(pool.attributes.price_change_percentage.h24) : undefined
                    };
                }),
                totalTVL,
                totalVolume
            }
        });

        return true;

    } catch (error) {
        elizaLogger.error('Error in GET_TOP_POOLS handler:', error);
        callback?.({
            text: "Sorry, I encountered an error while fetching the top pools. Please try again in a moment.",
            content: { action: "GET_TOP_POOLS", status: "error", error: String(error) }
        });
        return false;
    }
};

export const topPoolsAction: Action = {
    name: "GET_TOP_POOLS",
    description: "Get the top pools by volume or liquidity on a specific network",
    similes: [
        "TOP_POOLS",
        "HIGHEST_VOLUME_POOLS",
        "LARGEST_POOLS"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "What are the top pools on Aptos?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me the top 5 pools by volume"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Which pools have the highest liquidity?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "List the most active trading pairs"
            }
        }
    ]],
    handler,
    validate,
    suppressInitialMessage: true
};

export default topPoolsAction;
