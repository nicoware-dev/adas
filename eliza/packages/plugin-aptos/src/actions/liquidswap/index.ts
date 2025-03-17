import swapAction from "./swap";
import addLiquidityAction from "./add-liquidity";
import removeLiquidityAction from "./remove-liquidity";
import createPoolAction from "./create-pool";

export const liquidswapActions = [
    swapAction,
    addLiquidityAction,
    removeLiquidityAction,
    createPoolAction
];

export default liquidswapActions;
