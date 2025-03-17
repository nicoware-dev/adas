import type { Plugin } from "@elizaos/core";
import { analyticsActions } from "./analytics";

export const aptosAnalyticsPlugin: Plugin = {
    name: "aptos-analytics",
    description: "Aptos Analytics Plugin for Eliza - DeFi analytics, token prices, and market data for the Aptos ecosystem",
    actions: [
        ...analyticsActions
    ],
    evaluators: [],
    providers: [],
};

export default aptosAnalyticsPlugin;
