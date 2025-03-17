import { elizaLogger } from "@elizaos/core";
import type {
    ActionExample,
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    Action,
} from "@elizaos/core";
import { composeContext, generateObjectDeprecated, ModelClass } from "@elizaos/core";
import axios from "axios";

export interface TokenDetailsContent extends Content {
    tokenAddress?: string;
}

interface TokenDetails {
    name: string;
    symbol: string;
    tokenAddress?: string;
    faAddress?: string;
    decimals?: number;
    logoURI?: string;
    projectUrl?: string;
    extensions?: {
        coingeckoId?: string;
    };
}

function isTokenDetailsContent(content: unknown): content is TokenDetailsContent {
    elizaLogger.info("Content for token details", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    const c = content as Record<string, unknown>;
    return true; // tokenAddress is optional
}

const tokenDetailsTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "tokenAddress": "0x1::aptos_coin::AptosCoin"
}
\`\`\`

{{recentMessages}}
`;

/**
 * Fetches token details from the Aptos token list
 */
async function getTokenDetails(tokenAddress: string): Promise<TokenDetails> {
    try {
        // Try multiple token list sources for better reliability
        const tokenListSources = [
            "https://raw.githubusercontent.com/PanoraExchange/Aptos-Tokens/refs/heads/main/token-list.json",
            "https://raw.githubusercontent.com/hippospace/aptos-token-list/main/tokens.json"
        ];

        let tokenData = null;
        let error = null;

        // Try each source until we get data
        for (const source of tokenListSources) {
            try {
                elizaLogger.info(`Fetching token list from ${source}`);
                const res = await axios.get(source, { timeout: 5000 });
                tokenData = res.data;
                if (tokenData && Array.isArray(tokenData)) {
                    elizaLogger.info(`Successfully fetched token list from ${source}`);
                    break;
                }
            } catch (e) {
                error = e;
                elizaLogger.error(`Failed to fetch token list from ${source}`, e);
                // Continue to next source
            }
        }

        // If we couldn't get data from any source
        if (!tokenData) {
            throw error || new Error("Failed to fetch token list from all sources");
        }

        // Handle case where no token address is provided - return APT as default
        if (!tokenAddress || tokenAddress === "" || tokenAddress === "null") {
            elizaLogger.info("No token address provided, returning APT as default");
            const aptToken = tokenData.find((token: TokenDetails) =>
                token.symbol === "APT" ||
                token.tokenAddress === "0x1::aptos_coin::AptosCoin"
            );
            return aptToken || {
                name: "Aptos Coin",
                symbol: "APT",
                tokenAddress: "0x1::aptos_coin::AptosCoin",
                decimals: 8,
                logoURI: "",
                projectUrl: "https://aptoslabs.com/"
            };
        }

        // Normalize token address for comparison
        const normalizedAddress = tokenAddress.toLowerCase();

        // Parse token path components if present (address::module::struct)
        const tokenPathParts = normalizedAddress.split("::");
        const addressPart = tokenPathParts[0];

        // Log the normalized address for debugging
        elizaLogger.info(`Looking for token with normalized address: ${normalizedAddress}`);
        elizaLogger.info(`Address part: ${addressPart}, Full parts: ${JSON.stringify(tokenPathParts)}`);

        // Try to find the token by exact address match
        let token = tokenData.find(
            (tokenInfo: TokenDetails) => {
                const tokenAddrStr = (tokenInfo.tokenAddress || tokenInfo.faAddress || "").toLowerCase();
                return tokenAddrStr === normalizedAddress;
            }
        );

        // If not found by exact match, try matching just the address part
        if (!token && tokenPathParts.length > 1) {
            elizaLogger.info(`Trying to match by address part: ${addressPart}`);
            token = tokenData.find(
                (tokenInfo: TokenDetails) => {
                    const tokenAddrStr = (tokenInfo.tokenAddress || tokenInfo.faAddress || "").toLowerCase();
                    return tokenAddrStr.startsWith(addressPart);
                }
            );
        }

        // If still not found, try partial match
        if (!token) {
            elizaLogger.info(`Trying partial match for: ${normalizedAddress}`);
            token = tokenData.find(
                (tokenInfo: TokenDetails) => {
                    const tokenAddrStr = (tokenInfo.tokenAddress || tokenInfo.faAddress || "").toLowerCase();
                    return tokenAddrStr.includes(addressPart) || addressPart.includes(tokenAddrStr);
                }
            );
        }

        // Special case handling for known tokens
        if (!token) {
            // Special case for WrappedUSDT
            if (normalizedAddress.includes("fa_to_coin_wrapper::wrappedustdt")) {
                token = tokenData.find(
                    (e: TokenDetails) => e.faAddress === "0x357b0b74bc833e95a115ad22604854d6b0fca151cecd94111770e5d6ffc9dc2b"
                );
            }

            // Special case for Liquidswap token
            if (normalizedAddress.includes("liquidswap") || normalizedAddress.includes("liquid swap")) {
                token = tokenData.find(
                    (e: TokenDetails) => e.symbol === "LIQ" || e.name?.toLowerCase().includes("liquidswap")
                );
            }
        }

        // If still not found, create a basic token info
        if (!token) {
            elizaLogger.warn(`Token not found in list: ${tokenAddress}, creating basic info`);

            // Try to extract a meaningful symbol from the token path
            let symbol = "UNKNOWN";
            if (tokenPathParts.length > 2) {
                // Use the last part of the path as symbol
                symbol = tokenPathParts[tokenPathParts.length - 1].toUpperCase();
            } else {
                // Otherwise use the last part of the address
                symbol = addressPart.slice(-6).toUpperCase();
            }

            return {
                name: "Unknown Token",
                symbol: symbol,
                tokenAddress: tokenAddress,
                decimals: 8,
                logoURI: "",
                projectUrl: ""
            };
        }

        return token;
    } catch (error: unknown) {
        elizaLogger.error("Error fetching token details:", error);
        // Return basic info even on error
        return {
            name: "Unknown Token",
            symbol: tokenAddress.split("::").pop() || "UNKNOWN",
            tokenAddress: tokenAddress,
            decimals: 8,
            logoURI: "",
            projectUrl: ""
        };
    }
}

/**
 * Handler for the GET_TOKEN_DETAILS action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract token address from message
        const context = composeContext({
            state,
            template: tokenDetailsTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isTokenDetailsContent(content)) {
            callback?.({
                text: "Unable to process token details request.",
                content: { action: "GET_TOKEN_DETAILS", status: "error", error: "Invalid content" }
            });
            return false;
        }

        // Send a confirmation message first
        callback?.({
            text: `Fetching token details${content.tokenAddress ? ` for ${content.tokenAddress}` : ''}...`,
            content: { action: "GET_TOKEN_DETAILS", status: "pending" }
        });

        // Fetch token details
        const tokenDetails = await getTokenDetails(content.tokenAddress || "");

        // Format the response
        let response = "# Token Details\n\n";
        response += `## ${tokenDetails.name} (${tokenDetails.symbol})\n\n`;

        if (tokenDetails.tokenAddress || tokenDetails.faAddress) {
            response += `**Address**: \`${tokenDetails.tokenAddress || tokenDetails.faAddress}\`\n`;
        }

        if (tokenDetails.decimals) {
            response += `**Decimals**: ${tokenDetails.decimals}\n`;
        }

        if (tokenDetails.logoURI) {
            response += `**Logo**: ${tokenDetails.logoURI}\n`;
        }

        if (tokenDetails.projectUrl) {
            response += `**Project URL**: ${tokenDetails.projectUrl}\n`;
        }

        if (tokenDetails.extensions?.coingeckoId) {
            response += `**CoinGecko ID**: ${tokenDetails.extensions.coingeckoId}\n`;
        }

        callback?.({
            text: response,
            content: {
                action: "GET_TOKEN_DETAILS",
                status: "complete",
                tokenDetails
            }
        });

        return true;
    } catch (error) {
        elizaLogger.error("Error in GET_TOKEN_DETAILS handler:", error);
        callback?.({
            text: `Failed to get token details: ${error instanceof Error ? error.message : "Unknown error"}`,
            content: { action: "GET_TOKEN_DETAILS", status: "error", error: String(error) }
        });
        return false;
    }
};

/**
 * Action for getting token details
 */
const getTokenDetailsAction: Action = {
    name: "GET_TOKEN_DETAILS",
    description: "Get details about a specific token on the Aptos blockchain",
    similes: [
        "TOKEN_DETAILS",
        "TOKEN_INFO",
        "GET_TOKEN_INFO"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "What are the details of APT token?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Tell me about the 0x1::aptos_coin::AptosCoin token"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Show me information about USDC on Aptos"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return messageText.includes("token") &&
               (messageText.includes("details") ||
                messageText.includes("info") ||
                messageText.includes("information") ||
                messageText.includes("about"));
    },
    suppressInitialMessage: true
};

export default getTokenDetailsAction;
