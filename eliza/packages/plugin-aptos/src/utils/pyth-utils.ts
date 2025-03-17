import { elizaLogger } from "@elizaos/core";
import { AptosPriceServiceConnection } from "@pythnetwork/pyth-aptos-js";

// Pyth price feed IDs - copied directly from Move Agent Kit price-feed.ts
export const PYTH_PRICE_FEEDS = {
    "APT": "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5",
    "USDC": "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
    "USDT": "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
    "ETH": "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    "BTC": "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
};

// Standard list of price feeds to fetch - copied EXACTLY from Move Agent Kit's priceFeed array
const STANDARD_PRICE_FEEDS = [
    "0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a",
    "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
    "0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b",
    "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5",
    "0x9d4294bbcd1174d6f2003ec365831e64cc31d9f6f15a2b85399db8d5000960f6",
    "0x03ae4db29ed4ae33d323568895aa00337e658e348b37509f5372ae51f0af00d5",
    "0xc9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33",
    "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
];

/**
 * Ensure price IDs are properly formatted for the Pyth SDK
 * The SDK expects price IDs without the '0x' prefix
 */
function formatPriceIds(priceIds: string[]): string[] {
    return priceIds.map(id => id.startsWith('0x') ? id.substring(2) : id);
}

/**
 * Get Pyth price update data directly using the Pyth SDK
 * This is exactly how the Move Agent Kit implements its getPythData method
 *
 * IMPORTANT: This function follows the Move Agent Kit's implementation EXACTLY.
 * It always uses the STANDARD_PRICE_FEEDS list and ignores any specific token price feeds.
 * The Joule Finance contract expects this specific list of price feeds.
 *
 * @returns Raw price feed data that can be passed directly to the contract
 */
export async function getPythPriceUpdateData(): Promise<number[][]> {
    try {
        elizaLogger.info("Fetching Pyth price updates using SDK - following Move Agent Kit pattern");

        // Create a new connection to the Pyth price service - exact same code as Move Agent Kit
        const connection = new AptosPriceServiceConnection("https://hermes.pyth.network");

        // Format price IDs for the SDK (remove 0x prefix if present)
        const formattedFeeds = formatPriceIds(STANDARD_PRICE_FEEDS);

        elizaLogger.info(`Fetching ${formattedFeeds.length} Pyth price feeds - EXACTLY like Move Agent Kit`);

        try {
            // This is the key method that gets the price feed data from Pyth
            const priceUpdateData = await connection.getPriceFeedsUpdateData(formattedFeeds);

            // The data from the SDK is already in the correct format for passing to the contract
            elizaLogger.info(`Successfully fetched ${priceUpdateData.length} Pyth price updates`);

            // Return the update data exactly as provided by the SDK
            return priceUpdateData;
        } catch (pythError) {
            elizaLogger.error("Pyth SDK error:", pythError);
            throw new Error(`Pyth SDK error: ${pythError instanceof Error ? pythError.message : String(pythError)}`);
        }
    } catch (error) {
        elizaLogger.error("Error fetching Pyth price updates:", error);
        throw new Error(`Failed to fetch Pyth price updates: ${error instanceof Error ? error.message : String(error)}`);
    }
}
