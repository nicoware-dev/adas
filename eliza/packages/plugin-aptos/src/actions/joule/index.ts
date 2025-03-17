import lendAction from './lend';
import borrowAction from './borrow';
import repayAction from './repay';
import withdrawAction from './withdraw';
import claimRewardAction from './claim-reward';
import userPositionAction from './user-position';
import userAllPositionsAction from './user-all-positions';
import poolDetailAction from './pool-detail';
import allPoolsAction from './all-pools';

// Export all Joule actions
export const jouleActions = [
    lendAction,
    borrowAction,
    repayAction,
    withdrawAction,
    claimRewardAction,
    userPositionAction,
    userAllPositionsAction,
    poolDetailAction,
    allPoolsAction
];

export default jouleActions;
