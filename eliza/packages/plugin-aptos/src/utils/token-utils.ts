import { elizaLogger } from "@elizaos/core";

/**
 * Known fungible asset addresses from successful transactions
 */
export const FUNGIBLE_ASSET_ADDRESSES = {
    "USDC": "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b"
};

/**
 * Maps common token symbols to their Joule Finance token addresses
 */
export const JOULE_TOKEN_ADDRESSES = {
    "APT": "0x1::aptos_coin::AptosCoin",
    "USDC": "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC",
    "USDT": "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT",
    "BTC": "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::BTC",
    "ETH": "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::ETH",
};

/**
 * Maps tokens to whether they should be treated as fungible assets in Joule Finance
 */
export const TOKEN_IS_FUNGIBLE_ASSET = {
    "APT": false,
    "USDC": true,
    "USDT": true,
    "BTC": true,
    "ETH": true,
};

/**
 * Normalizes token symbols to their full addresses
 */
export function normalizeTokenSymbol(tokenSymbol: string): string {
    const symbol = tokenSymbol.toLowerCase();

    // If it's already a full address, return it as is
    if (symbol.includes("::")) {
        return tokenSymbol;
    }

    if (symbol === "apt" || symbol === "aptos") {
        return "0x1::aptos_coin::AptosCoin";
    }

    if (symbol === "usdc") {
        // Use the correct USDC address from the Joule Finance integration
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC";
    }

    if (symbol === "usdt") {
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT";
    }

    if (symbol === "btc" || symbol === "bitcoin") {
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::BTC";
    }

    if (symbol === "eth" || symbol === "ethereum") {
        return "0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::ETH";
    }

    // If it's a hex address without module path, return as is
    if (symbol.match(/^0x[0-9a-f]+$/i)) {
        return tokenSymbol;
    }

    // Default case - return as is with a warning
    elizaLogger.warn(`Unknown token symbol: ${tokenSymbol}, returning as is`);
    return tokenSymbol;
}

/**
 * Determines whether a token should be treated as a fungible asset
 */
export function isFungibleAsset(tokenType: string): boolean {
    const symbol = normalizeTokenSymbol(tokenType).toLowerCase();

    // APT is always handled as a standard coin, not a fungible asset
    if (symbol === "apt" || symbol === "aptos" || symbol.includes("aptoscoin")) {
        return false;
    }

    // Most tokens in Joule Finance are handled as fungible assets
    if (symbol.includes("usdc") || symbol.includes("usdt") ||
        symbol.includes("btc") || symbol.includes("eth")) {
        return true;
    }

    // Default to false for unknown tokens
    return false;
}

/**
 * Returns the exact fungible asset address for a token
 * This is the actual address of the token for use with fungible asset functions
 */
export function getFungibleAssetAddress(tokenSymbol: string): string {
    const symbol = tokenSymbol.toLowerCase();

    if (symbol.includes("usdc")) {
        return FUNGIBLE_ASSET_ADDRESSES.USDC;
    }

    // Default to extracting from the token type
    const normalizedType = normalizeTokenSymbol(tokenSymbol);

    // Extract just the address part for fungible assets
    if (normalizedType.includes("::")) {
        return normalizedType.split("::")[0];
    }

    // Return as is if it's already an address
    if (normalizedType.match(/^0x[0-9a-f]+$/i)) {
        return normalizedType;
    }

    // Default case - log a warning and return a placeholder
    elizaLogger.warn(`Unknown fungible asset: ${tokenSymbol}, cannot determine exact address`);
    return normalizedType;
}
