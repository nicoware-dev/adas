import transferAptos from './transfer';
import tokenTransfer from './token-transfer';
import balanceAction from './balance';
import getTokenDetailsAction from './get-token-details';
import getTokenPriceAction from './get-token-price';
import getTransactionAction from './get-transaction';
import createTokenAction from './create-token';
import mintTokenAction from './mint-token';
import burnTokenAction from './burn-token';
import transferNftAction from './transfer-nft';
import burnNftAction from './burn-nft';
import getAccountAction from './get-account';
import getModulesAction from './get-modules';
import createNftAction from './create-nft';
import { jouleActions } from './joule';
import { amnisActions } from './amnis';
import { thalaActions } from './thala';
import { liquidswapActions } from './liquidswap';
import { ariesActions } from "./aries";
import { merkleTradeActions } from "./merkle-trade";

// Export all actions
export const actions = [
    // Core Aptos actions
    transferNftAction,  // Prioritize NFT transfers
    tokenTransfer,
    transferAptos,
    balanceAction,
    getTokenDetailsAction,
    getTokenPriceAction,
    getTransactionAction,
    createTokenAction,
    mintTokenAction,
    burnTokenAction,
    burnNftAction,
    getAccountAction,
    getModulesAction,
    createNftAction,

    // Protocol-specific actions
    ...jouleActions,
    ...amnisActions,
    ...thalaActions,
    ...liquidswapActions,
    ...merkleTradeActions,
    ...ariesActions,
];

// Export individual modules with namespaces
export * as joule from './joule';
export * as amnis from './amnis';
export * as thala from './thala';
export * as liquidswap from './liquidswap';
export * as merkleTrade from './merkle-trade';
export * as aries from './aries';

export default actions;
