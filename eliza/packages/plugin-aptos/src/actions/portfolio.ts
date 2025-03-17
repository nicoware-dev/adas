import { elizaLogger } from "@elizaos/core";
import type {
    Content,
    HandlerCallback,
    IAgentRuntime,
    Memory,
    State,
    Action,
} from "@elizaos/core";
import { composeContext, generateObjectDeprecated, ModelClass } from "@elizaos/core";
import {
    Aptos,
    AptosConfig,
    Network,
    AccountAddress,
    Account,
    Ed25519PrivateKey,
} from "@aptos-labs/ts-sdk";
import { validateAptosConfig } from "../enviroment";
import { normalizeTokenSymbol, isFungibleAsset } from "../utils/token-utils";
import axios from 'axios';

export interface PortfolioContent extends Content {
    address?: string;
}

function isPortfolioContent(content: unknown): content is PortfolioContent {
    elizaLogger.info("Content for portfolio lookup", content);
    if (typeof content !== "object" || content === null) {
        return false;
    }

    // Address is optional - if not provided, agent's own wallet will be used
    return true;
}

const portfolioTemplate = `Respond with a JSON markdown block containing only the extracted values. Use null for any values that cannot be determined.

Example response:
\`\`\`json
{
    "address": "0x123..." // Optional - If user is asking about a specific wallet address
}
\`\`\`

{{recentMessages}}
`;

// Token price fetcher - using CoinGecko API
interface TokenWithPrice {
    symbol: string;
    name: string;
    balance: string;
    decimals: number;
    value: string | null;
    tokenAddress: string;
    isFungibleAsset: boolean;
}

interface NFTItem {
    name: string;
    collection: string;
    tokenId: string;
    uri?: string;
}

// Map of token symbols to CoinGecko IDs
const TOKEN_TO_COINGECKO_ID: Record<string, string> = {
    // Aptos
    'apt': 'aptos',
    'abtc': 'abtc',
    'usdy': 'ondo-us-dollar-yield',
    'amapt': 'amnis-aptos',
    'amAPT': 'amnis-aptos',
    'truapt': 'trufin-staked-apt',
    'stapt': 'amnis-staked-aptos-coin',
    'stAPT': 'amnis-staked-aptos-coin',
    'wapt': 'wrapped-aptos',
    'wAPT': 'wrapped-aptos',
    'stakt': 'amnis-staked-aptos-coin',
    'amnisapt': 'amnis-aptos',
    'AmnisApt': 'amnis-aptos',
    'stakedapt': 'amnis-staked-aptos-coin',
    'StakedApt': 'amnis-staked-aptos-coin',

    // Stablecoins - include duplicates
    'usdc': 'usd-coin',
    'zusdc': 'usd-coin',
    'layerzerobridged-usdc': 'usd-coin',
    'layerzero-usdc': 'usd-coin',
    'usdt': 'tether',
    'zusdt': 'tether',
    'layerzerobridged-usdt': 'tether',
    'layerzero-usdt': 'tether',

    // Ethereum
    'eth': 'ethereum',
    'weth': 'weth',

    // Bitcoin
    'btc': 'bitcoin',
    'wbtc': 'wrapped-bitcoin',

    // Major Layer 1s
    'bnb': 'binancecoin',
    'sol': 'solana',
    'ada': 'cardano',
    'avax': 'avalanche-2',
    'dot': 'polkadot',
    'matic': 'matic-network',
    'near': 'near',
    'atom': 'cosmos',
    'ftm': 'fantom',
    'arb': 'arbitrum',
    'op': 'optimism',

    // DeFi
    'uni': 'uniswap',
    'aave': 'aave',
    'link': 'chainlink',
    'crv': 'curve-dao-token',
    'mkr': 'maker',
    'comp': 'compound-governance-token',
    'sushi': 'sushi',
    'cake': 'pancakeswap-token',
    'snx': 'synthetix-network-token',
    '1inch': '1inch',
};

// Cache for token prices to reduce API calls
interface PriceCache {
    [key: string]: {
        price: number;
        timestamp: number;
    };
}

const priceCache: PriceCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

// Format currency with appropriate precision
function formatCurrency(value: number): string {
    if (value >= 1000) {
        return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    if (value >= 1) {
        return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

// Get CoinGecko ID for a token symbol
function getTokenCoinGeckoId(symbol: string): string | null {
    const normalizedSymbol = symbol.toLowerCase();
    return TOKEN_TO_COINGECKO_ID[normalizedSymbol] || null;
}

/**
 * Gets token prices from CoinGecko API
 */
async function getTokenPrices(symbols: string[]): Promise<Map<string, number>> {
    try {
        const priceMap = new Map<string, number>();

        // Only proceed if we have symbols to look up
        if (symbols.length === 0) {
            return priceMap;
        }

        // Get unique symbols - allow varying case for lookup
        const uniqueSymbols = Array.from(new Set(symbols));
        const now = Date.now();

        // Check which symbols we need to fetch (not in cache)
        const symbolsToFetch: string[] = [];
        const coinGeckoIds: string[] = [];
        const symbolToId: Record<string, string> = {};

        // Special handling for staked tokens
        const stakedTokenVariants = ['stapt', 'stakt', 'stakedapt', 'stAPT', 'StakedApt'];

        for (const symbol of uniqueSymbols) {
            // Skip empty symbols
            if (!symbol) continue;

            const lookupSymbol = symbol.toLowerCase();
            const originalSymbol = symbol; // Preserve original case

            // First check cache
            if (priceCache[lookupSymbol] && now - priceCache[lookupSymbol].timestamp < CACHE_TTL) {
                priceMap.set(originalSymbol, priceCache[lookupSymbol].price);
                continue;
            }

            // Try direct lookup with original case first
            let id = getTokenCoinGeckoId(originalSymbol);

            // If that fails, try lowercase
            if (!id) {
                id = getTokenCoinGeckoId(lookupSymbol);
            }

            // Special handling for staked tokens
            if (!id && (lookupSymbol.includes('stakedapt') || lookupSymbol.includes('stapt') || lookupSymbol.includes('stakt'))) {
                id = 'amnis-staked-aptos-coin';
                elizaLogger.info(`Special case: Using ID ${id} for ${originalSymbol}`);
            } else if (!id && (lookupSymbol.includes('amnisapt') || lookupSymbol.includes('amapt'))) {
                id = 'amnis-aptos';
                elizaLogger.info(`Special case: Using ID ${id} for ${originalSymbol}`);
            }

            if (id) {
                symbolsToFetch.push(originalSymbol);
                coinGeckoIds.push(id);
                symbolToId[originalSymbol] = id;
            } else {
                // Try alternate normalization
                const normalizedSymbol = lookupSymbol.replace(/[ _-]/g, '').toLowerCase();
                const alternateId = getTokenCoinGeckoId(normalizedSymbol);

                if (alternateId) {
                    symbolsToFetch.push(originalSymbol);
                    coinGeckoIds.push(alternateId);
                    symbolToId[originalSymbol] = alternateId;
                    elizaLogger.info(`Using alternate mapping for ${originalSymbol}: ${alternateId}`);
                }
            }
        }

        // If all prices are in cache, return early
        if (symbolsToFetch.length === 0) {
            return priceMap;
        }

        // Fetch prices from CoinGecko
        elizaLogger.info(`Fetching prices for ${symbolsToFetch.length} tokens from CoinGecko`);
        const response = await axios.get(
            `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${Array.from(new Set(coinGeckoIds)).join(',')}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
        );

        if (!response.data || !Array.isArray(response.data)) {
            elizaLogger.error("Invalid response from CoinGecko API");
            return priceMap;
        }

        // Process each token price
        for (const item of response.data) {
            // Find all symbols for this coin
            const matchingSymbols = Object.keys(symbolToId).filter(s => symbolToId[s] === item.id);
            if (matchingSymbols.length === 0) continue;

            const price = item.current_price;

            // Cache and add price for each matching symbol
            for (const symbol of matchingSymbols) {
                const lowercaseSymbol = symbol.toLowerCase();

                // Cache the price (lowercase for consistent cache keys)
                priceCache[lowercaseSymbol] = {
                    price,
                    timestamp: now
                };

                // Add to price map with original case
                priceMap.set(symbol, price);
                elizaLogger.info(`Price for ${symbol}: $${price}`);
            }
        }

        return priceMap;
    } catch (error) {
        elizaLogger.error("Error fetching token prices from CoinGecko:", error);
        return new Map<string, number>();
    }
}

/**
 * Gets a user's portfolio from the Aptos blockchain
 */
async function getPortfolio(
    aptosClient: Aptos,
    address: string
): Promise<{
    accountAddress: string;
    tokens: TokenWithPrice[];
    nfts: NFTItem[];
    totalValue: string;
}> {
    try {
        const accountAddress = AccountAddress.fromString(address);

        // Tokens and NFTs to return
        const tokens: TokenWithPrice[] = [];
        const nfts: NFTItem[] = [];
        let totalValue = 0;

        // Track token addresses we've processed
        const processedTokenAddresses = new Set<string>();

        // Skip deduplication completely for certain tokens to allow multiple instances
        const neverDeduplicate = ['usdc', 'usdt', 'dai', 'busd', 'tusd'];

        // Map of addresses to their original symbols to preserve case
        const tokenAddressToSymbol = new Map<string, string>();

        // 1. Get account resources for standard coins
        const resources = await aptosClient.account.getAccountResources({
            accountAddress
        });

        // Extract coin balances from resources
        for (const resource of resources) {
            // Check if this is a coin store
            if (resource.type.startsWith("0x1::coin::CoinStore<")) {
                // Extract coin type
                const coinType = resource.type.substring("0x1::coin::CoinStore<".length, resource.type.length - 1);

                // Skip duplicate token addresses
                if (processedTokenAddresses.has(coinType)) {
                    continue;
                }
                processedTokenAddresses.add(coinType);

                // Get coin metadata if available
                let name = coinType;
                let symbol = coinType.split("::").pop() || coinType;
                let decimals = 8; // Default for most Aptos tokens

                // Extract symbol from the name for better display
                if (symbol.includes("::")) {
                    symbol = symbol.split("::").pop() || symbol;
                }

                // Check for well-known tokens and preserve their original case/format
                if (coinType === "0x1::aptos_coin::AptosCoin") {
                    name = "Aptos Coin";
                    symbol = "APT";
                    decimals = 8;
                } else if (symbol.toLowerCase() === "stakedapt" || symbol.toLowerCase() === "stapt") {
                    // Ensure stAPT is displayed with correct case
                    symbol = "stAPT";
                } else if (symbol.toLowerCase() === "amnisapt" || symbol.toLowerCase() === "amapt") {
                    // Ensure amAPT is displayed with correct case
                    symbol = "amAPT";
                }

                // Get balance
                const data = resource.data as { coin: { value: string } };
                const balanceRaw = data.coin.value;
                const balance = Number(balanceRaw) / (10 ** decimals);

                // Add to tokens list
                tokens.push({
                    symbol: symbol,
                    name: name,
                    balance: balance.toFixed(decimals > 6 ? 6 : decimals),
                    decimals: decimals,
                    value: null, // Will be filled later
                    tokenAddress: coinType,
                    isFungibleAsset: false
                });

                // Save original symbol for this address
                tokenAddressToSymbol.set(coinType, symbol);
            }
        }

        // 2. Get fungible asset balances
        const fungibleAssets = await aptosClient.getCurrentFungibleAssetBalances({
            options: {
                where: {
                    owner_address: {
                        _eq: address,
                    },
                },
            },
        });

        // Process fungible assets - no deduplication for different asset addresses
        for (const asset of fungibleAssets) {
            // Skip exact duplicate token addresses
            if (processedTokenAddresses.has(asset.asset_type)) {
                continue;
            }

            // Mark this token address as processed
            processedTokenAddresses.add(asset.asset_type);

            try {
                // Get metadata for the fungible asset
                const metadata = await aptosClient.getFungibleAssetMetadata({
                    options: {
                        where: {
                            asset_type: {
                                _eq: asset.asset_type
                            }
                        }
                    }
                });

                // Set default values
                let name = asset.asset_type;
                let symbol = "UNKNOWN";
                let decimals = 8;

                // Try to extract metadata if available
                if (metadata && metadata.length > 0) {
                    name = metadata[0].name || asset.asset_type;
                    symbol = metadata[0].symbol || "UNKNOWN";
                    decimals = metadata[0].decimals || 8;
                }

                // Apply correct casing for special tokens
                if (symbol.toLowerCase() === "stakedapt" || symbol.toLowerCase() === "stapt") {
                    symbol = "stAPT";
                } else if (symbol.toLowerCase() === "amnisapt" || symbol.toLowerCase() === "amapt") {
                    symbol = "amAPT";
                }

                const balance = Number(asset.amount) / (10 ** decimals);

                // Add to tokens list
                tokens.push({
                    symbol: symbol,
                    name: name,
                    balance: balance.toFixed(decimals > 6 ? 6 : decimals),
                    decimals: decimals,
                    value: null, // Will be filled later
                    tokenAddress: asset.asset_type,
                    isFungibleAsset: true
                });

                // Save original symbol for this address
                tokenAddressToSymbol.set(asset.asset_type, symbol);
            } catch (error) {
                elizaLogger.error(`Error processing fungible asset ${asset.asset_type}:`, error);
                // Add basic info if metadata fetch fails
                tokens.push({
                    symbol: "UNKNOWN",
                    name: asset.asset_type,
                    balance: (Number(asset.amount) / 1e8).toFixed(8),
                    decimals: 8,
                    value: null,
                    tokenAddress: asset.asset_type,
                    isFungibleAsset: true
                });
            }
        }

        // 3. Get NFTs (digital assets)
        try {
            const digitalAssets = await aptosClient.getOwnedDigitalAssets({
                ownerAddress: accountAddress,
            });

            for (const asset of digitalAssets) {
                nfts.push({
                    name: asset.current_token_data?.token_name || "Unknown NFT",
                    collection: asset.current_token_data?.collection_id || "Unknown Collection",
                    tokenId: asset.token_data_id,
                    uri: asset.current_token_data?.token_uri
                });
            }
        } catch (error) {
            elizaLogger.error("Error fetching NFTs:", error);
        }

        // 4. Get token prices and calculate values
        if (tokens.length > 0) {
            // Extract symbols for price lookup
            const symbols = tokens.map(token => token.symbol);
            const priceMap = await getTokenPrices(symbols);

            // Add value information to tokens
            for (const token of tokens) {
                // Try with original symbol case first
                let price = priceMap.get(token.symbol);

                // If not found, try with lowercase
                if (!price) {
                    price = priceMap.get(token.symbol.toLowerCase());
                }

                // For staked tokens, try alternate lookup if needed
                if (!price) {
                    const lookupSymbol = token.symbol.toLowerCase();

                    if (lookupSymbol.includes('stakedapt') || lookupSymbol.includes('stapt') || lookupSymbol.includes('stakt')) {
                        // Try all possible case variations
                        price = priceMap.get('stAPT') || priceMap.get('stapt') || priceMap.get('StakedApt') ||
                                priceMap.get('stakedapt') || priceMap.get('stakt');

                        if (price) {
                            elizaLogger.info(`Found price for ${token.symbol} using alternative staked token lookup`);
                        }
                    } else if (lookupSymbol.includes('amnisapt') || lookupSymbol.includes('amapt')) {
                        // Try all possible case variations
                        price = priceMap.get('amAPT') || priceMap.get('AmnisApt') ||
                                priceMap.get('amnisapt') || priceMap.get('amapt');

                        if (price) {
                            elizaLogger.info(`Found price for ${token.symbol} using alternative amnis token lookup`);
                        }
                    }
                }

                if (price) {
                    const value = Number(token.balance) * price;
                    token.value = value.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                    totalValue += value;
                }
            }
        }

        return {
            accountAddress: address,
            tokens,
            nfts,
            totalValue: totalValue.toLocaleString('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            })
        };
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to get portfolio: ${error.message}`);
        }
        throw new Error("Failed to get portfolio with unknown error");
    }
}

/**
 * Handler for the PORTFOLIO action
 */
const handler = async (
    runtime: IAgentRuntime,
    message: Memory,
    state: State,
    _options: unknown,
    callback?: HandlerCallback
): Promise<boolean> => {
    try {
        // Extract address from message
        const context = composeContext({
            state,
            template: portfolioTemplate,
        });

        const content = await generateObjectDeprecated({
            runtime,
            context,
            modelClass: ModelClass.SMALL,
        });

        if (!isPortfolioContent(content)) {
            callback?.({
                text: "I couldn't process your portfolio request. Please try again.",
                content: { action: "PORTFOLIO", status: "error", error: "Invalid content format" }
            });
            return false;
        }

        // Initialize Aptos client and account
        const config = await validateAptosConfig(runtime);
        const aptosConfig = new AptosConfig({
            network: config.APTOS_NETWORK as Network
        });
        const aptosClient = new Aptos(aptosConfig);

        // Create account from private key
        const privateKey = new Ed25519PrivateKey(config.APTOS_PRIVATE_KEY);
        const account = Account.fromPrivateKey({ privateKey });

        // Determine which address to check
        let addressToCheck: string;

        if (content.address?.startsWith("0x")) {
            // If user specified a valid address, use it
            addressToCheck = content.address;
        } else {
            // Otherwise use the agent's wallet address
            addressToCheck = account.accountAddress.toString();
        }

        // Send a confirmation message first
        if (callback) {
            callback({
                text: `Looking up portfolio for ${addressToCheck}...`,
                content: { action: "PORTFOLIO", status: "pending" }
            });
        }

        // Get the portfolio
        const portfolio = await getPortfolio(aptosClient, addressToCheck);

        // Format the response
        const response = [
            "# Portfolio",
            "",
            `**Wallet Address**: \`${portfolio.accountAddress}\``,
            "",
        ];

        // Add token section if there are tokens
        if (portfolio.tokens.length > 0) {
            response.push("## Tokens");
            response.push("");

            // Sort tokens - valuable tokens first, then alphabetically
            const sortedTokens = [...portfolio.tokens].sort((a, b) => {
                if (a.value && b.value) {
                    return Number(b.value.replace(/,/g, '')) - Number(a.value.replace(/,/g, ''));
                }
                if (a.value) {
                    return -1;
                }
                if (b.value) {
                    return 1;
                }
                return a.symbol.localeCompare(b.symbol);
            });

            // List tokens as bullet points
            for (const token of sortedTokens) {
                const valueDisplay = token.value ? `$${token.value}` : "Value unknown";
                // Shorten token address for certain tokens to improve readability
                const addressDisplay = token.tokenAddress.length > 40 &&
                    (token.symbol.toLowerCase() === "usdc" || token.symbol.toLowerCase() === "usdt") ?
                    ` (${token.tokenAddress.substring(0, 10)}...${token.tokenAddress.substring(token.tokenAddress.length - 8)})` : "";

                response.push(`- **${token.symbol}${addressDisplay}** (${token.name}): ${token.balance} ${token.symbol} - ${valueDisplay}`);
            }

            response.push("");
            response.push(`**Total Value**: $${portfolio.totalValue}`);
            response.push("");
        } else {
            response.push("No tokens found in this wallet.");
            response.push("");
        }

        // Add NFT section if there are NFTs
        if (portfolio.nfts.length > 0) {
            response.push("## NFTs");
            response.push("");

            // List NFTs as bullet points
            for (const nft of portfolio.nfts) {
                const shortTokenId = `${nft.tokenId.substring(0, 10)}...${nft.tokenId.substring(nft.tokenId.length - 6)}`;
                response.push(`- **${nft.name}** - Collection: ${nft.collection}`);
            }

            response.push("");
            response.push(`Total NFTs: ${portfolio.nfts.length}`);
            response.push("");
        } else {
            response.push("No NFTs found in this wallet.");
        }

        if (callback) {
            callback({
                text: response.join("\n"),
                content: {
                    action: "PORTFOLIO",
                    status: "complete",
                    address: portfolio.accountAddress,
                    tokens: portfolio.tokens,
                    nfts: portfolio.nfts,
                    totalValue: portfolio.totalValue
                }
            });
        }

        return true;
    } catch (error) {
        elizaLogger.error("Error in PORTFOLIO handler:", error);
        if (callback) {
            callback({
                text: `Failed to get portfolio: ${error instanceof Error ? error.message : "Unknown error"}`,
                content: { action: "PORTFOLIO", status: "error", error: String(error) }
            });
        }
        return false;
    }
};

/**
 * Action for viewing a wallet's portfolio
 */
const portfolioAction: Action = {
    name: "PORTFOLIO",
    description: "Get the portfolio (tokens and NFTs) for a wallet address",
    similes: [
        "GET_PORTFOLIO",
        "WALLET_PORTFOLIO",
        "SHOW_PORTFOLIO"
    ],
    examples: [[
        {
            user: "user",
            content: {
                text: "Show my portfolio"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "What tokens do I have in my wallet?"
            }
        }
    ], [
        {
            user: "user",
            content: {
                text: "Check the portfolio for 0x123456789abcdef"
            }
        }
    ]],
    handler,
    validate: async (_runtime, message) => {
        const messageText = message.content?.text?.toLowerCase() || "";
        return (messageText.includes("portfolio") ||
                messageText.includes("wallet") ||
                (messageText.includes("tokens") && (messageText.includes("have") || messageText.includes("own"))) ||
                (messageText.includes("nft") && (messageText.includes("have") || messageText.includes("own"))) ||
                messageText.includes("holdings"));
    },
    suppressInitialMessage: true
};

export default portfolioAction;
