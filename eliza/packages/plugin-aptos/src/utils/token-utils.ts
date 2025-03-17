import { elizaLogger } from "@elizaos/core";

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
        // Use the correct USDC address from the Liquidswap docs
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
