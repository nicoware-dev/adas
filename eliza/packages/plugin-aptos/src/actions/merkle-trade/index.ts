import { elizaLogger } from "@elizaos/core";
import merkleGetPositionsAction from "./get-positions";
import merklePlaceLimitOrderAction from "./place-limit-order";
import merklePlaceMarketOrderAction from "./place-market-order";
import merkleClosePositionAction from "./close-position";

export const merkleTradeDeps = {
  merkleGetPositionsAction,
  merklePlaceLimitOrderAction,
  merklePlaceMarketOrderAction,
  merkleClosePositionAction,
};

export const merkleTradeActions = [
  merkleGetPositionsAction,
  merklePlaceLimitOrderAction,
  merklePlaceMarketOrderAction,
  merkleClosePositionAction,
];

export default merkleTradeActions;

// Log initialization of Merkle Trade actions
elizaLogger.info("Merkle Trade actions loaded successfully", {
  actionsCount: merkleTradeActions.length,
});
