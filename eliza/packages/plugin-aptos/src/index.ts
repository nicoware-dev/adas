import type { Plugin } from "@elizaos/core";
import { actions } from "./actions";
import { walletProvider } from "./providers/wallet";
import merkleTradeActions from "./actions/merkle-trade";
import thalaActions from "./actions/thala";

export const aptosPlugin: Plugin = {
    name: "aptos",
    description: "Aptos Plugin for Eliza - Aptos blockchain integration with DeFi protocols and analytics",
    actions: [
        ...actions,
        ...merkleTradeActions,
        ...thalaActions
    ],
    evaluators: [],
    providers: [walletProvider],
};

export default aptosPlugin;
