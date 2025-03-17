import stakeAction from './stake';
import unstakeAction from './unstake';
import checkRewardsAction from './check-rewards';
import checkApyAction from './check-apy';

// Export all Amnis actions
export const amnisActions = [
    stakeAction,
    unstakeAction,
    checkRewardsAction,
    checkApyAction
];

export default amnisActions;
