import { elizaLogger } from "@elizaos/core";
import {
    type ActionExample,
    type Content,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    type Action,
} from "@elizaos/core";
import { composeContext } from "@elizaos/core";
import { generateObjectDeprecated } from "@elizaos/core";

export interface TokenPriceContent extends Content {
    tokenQuery: string;
}

interface PriceFeedItem {
    id: string;
    displayName: string;
    symbol: string;
    price: string;
}

interface PriceData {
    id: string;
    price: {
        price: string;
        expo: number;
    };
}

interface AssetData {
    id: string;
    attributes: {
        display_symbol: string;
        symbol: string;
    };
}

function isTokenPriceContent(content: unknown): content is TokenPriceContent {
    elizaLogger.info("Content for token price", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return typeof c.tokenQuery === "string";
}

const tokenPriceTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenQuery": "APT"
}
\`\`\`

{{recentMessages}}

Given the recent messages, extract the following information about the requested token price:
- Token symbol or name to check price for

Respond with a JSON markdown block containing only the extracted values.`;

/**
 * Fetches token price from the Pyth network
 */
async function getTokenPrice(query: string): Promise<PriceFeedItem[]> {
    try {
        elizaLogger.info(`Fetching token price for query: ${query}`);

        // Fetch asset data
        const assetDataResponse = await fetch(`https://hermes.pyth.network/v2/price_feeds?query=${encodeURIComponent(query)}&asset_type=crypto`);

        if (!assetDataResponse.ok) {
            throw new Error(`Asset data fetch failed with status: ${assetDataResponse.status}`);
        }

        const assetData = await assetDataResponse.json() as AssetData[];
        elizaLogger.info(`Found ${assetData.length} assets matching query "${query}"`);

        if (!assetData || assetData.length === 0) {
            throw new Error(`No assets found for query: ${query}`);
        }

        const formattedData = assetData.map((data) => {
            return {
                id: data.id,
                displayName: data.attributes.display_symbol,
                symbol: data.attributes.symbol,
            };
        });

        const assetIdArray = formattedData.map((data) => data.id);

        if (assetIdArray.length === 0) {
            throw new Error("No asset IDs found for the given query");
        }

        // Fetch price data
        const assetPriceDataUrl = `https://hermes.pyth.network/v2/updates/price/latest?ids[]=${assetIdArray.join("&ids[]=")}`;
        elizaLogger.info(`Fetching price data from: ${assetPriceDataUrl}`);

        const assetPriceDataResponse = await fetch(assetPriceDataUrl);

        if (!assetPriceDataResponse.ok) {
            throw new Error(`Price data fetch failed with status: ${assetPriceDataResponse.status}`);
        }

        const assetPriceData = await assetPriceDataResponse.json();

        if (!assetPriceData || !assetPriceData.parsed) {
            throw new Error("Invalid price data response format");
        }

        // Create price feed with all available data
        const priceFeed: PriceFeedItem[] = [];

        for (const data of formattedData) {
            try {
                const priceData = assetPriceData.parsed.find((price: PriceData) => price.id === data.id);

                if (!priceData || !priceData.price) {
                    elizaLogger.warn(`No price data found for ${data.symbol}`);
                    continue;
                }

                // Calculate price value using the same formula as Move Agent Kit
                const priceValue = Number(priceData.price.price) / (10 ** Math.abs(priceData.price.expo));

                priceFeed.push({
                    ...data,
                    price: priceValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
                });

                elizaLogger.info(`Price for ${data.symbol}: $${priceValue}`);
            } catch (err) {
                elizaLogger.error(`Error processing price data for ${data.symbol}:`, err);
                // Continue with other tokens even if one fails
            }
        }

        if (priceFeed.length === 0) {
            throw new Error("Could not retrieve price data for the specified token");
        }

        elizaLogger.info(`Successfully retrieved price data for ${priceFeed.length} tokens`);
        return priceFeed;
    } catch (error) {
        elizaLogger.error("Error fetching token price:", error);
        if (error instanceof Error) {
            throw new Error(`Token price fetch failed: ${error.message}`);
        }
        throw new Error("Token price fetch failed with unknown error");
    }
}

/**
 * Handler for the GET_TOKEN_PRICE action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    elizaLogger.info("Starting GET_TOKEN_PRICE handler");

    try {
        // Initialize or update state
        let currentState = state;
        if (!currentState) {
            currentState = (await runtime.composeState(message)) as State;
        } else {
            currentState = await runtime.updateRecentMessageState(currentState);
        }

        // Compose token price context
        const tokenPriceContext = composeContext({
            state: currentState,
            template: tokenPriceTemplate,
        });

        // Generate token price content
        elizaLogger.info("Generating token price content");
        const content = await generateObjectDeprecated({
            runtime,
            context: tokenPriceContext,
            modelClass: ModelClass.SMALL,
        });

        if (!isTokenPriceContent(content) || !content.tokenQuery) {
            const errorMsg = "Please specify a valid token to get the price for.";
            elizaLogger.error("Invalid content for GET_TOKEN_PRICE action:", content);
            if (callback) {
                callback({
                    text: errorMsg,
                    content: { action: "GET_TOKEN_PRICE", status: "error", error: "No valid token specified" }
                });
            }
            return false;
        }

        // Send a confirmation message first
        elizaLogger.info(`Fetching price for token: ${content.tokenQuery}`);
        if (callback) {
            callback({
                text: `Fetching price for ${content.tokenQuery}...`,
                content: { action: "GET_TOKEN_PRICE", status: "pending" }
            });
        }

        // Fetch token price
        const priceFeed = await getTokenPrice(content.tokenQuery);

        // Format the response
        let response = "# Token Prices\n\n";

        for (const item of priceFeed) {
            response += `## ${item.displayName} (${item.symbol})\n`;
            response += `**Current Price**: $${item.price}\n\n`;
        }

        elizaLogger.info(`Successfully retrieved prices for ${content.tokenQuery}`);
        if (callback) {
            callback({
                text: response,
                content: {
                    action: "GET_TOKEN_PRICE",
                    status: "complete",
                    priceFeed
                }
            });
        }

        return true;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        elizaLogger.error("Error in GET_TOKEN_PRICE handler:", error);

        if (callback) {
            callback({
                text: `Failed to get token price: ${errorMessage}`,
                content: { action: "GET_TOKEN_PRICE", status: "error", error: errorMessage }
            });
        }
        return false;
    }
};

/**
 * Action for getting token price
 */
const getTokenPriceAction: Action = {
    name: "GET_TOKEN_PRICE",
    description: "Get the current price of a token on the Aptos blockchain",
    similes: [
        "TOKEN_PRICE",
        "PRICE",
        "GET_PRICE"
    ],
    examples: [[
        {
            user: "{{user1}}",
            content: {
                text: "What is the price of APT?"
            }
        },
        {
            user: "{{user2}}",
            content: {
                text: "Fetching price for APT...",
                action: "GET_TOKEN_PRICE"
            }
        },
        {
            user: "{{user2}}",
            content: {
                text: "# Token Prices\n\n## APT (APT)\n**Current Price**: $5.23\n\n"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        elizaLogger.info("Validating token price request from user:", message.userId);
        return true;
    },
};

export default getTokenPriceAction;
