import { elizaLogger } from "@elizaos/core";
import swapAction from './swap';
import addLiquidityAction from './add-liquidity';
import removeLiquidityAction from './remove-liquidity';
import stakeAction from './stake';
import unstakeAction from './unstake';

// Export all Thala actions
export const thalaActions = [
    swapAction,
    addLiquidityAction,
    removeLiquidityAction,
    stakeAction,
    unstakeAction,
];

// Log initialization of Thala actions
elizaLogger.info("Thala Protocol actions loaded successfully", {
    actionsCount: thalaActions.length,
});

export default thalaActions;
