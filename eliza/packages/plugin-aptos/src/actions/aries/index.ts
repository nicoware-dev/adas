import { elizaLogger } from "@elizaos/core";
import createProfileAction from "./create-profile";
import lendAction from "./lend";
import borrowAction from "./borrow";
import repayAction from "./repay";
import withdrawAction from "./withdraw";

// Export all Aries actions
export const ariesActions = [
    createProfileAction,
    lendAction,
    borrowAction,
    repayAction,
    withdrawAction
];

// Log initialization of Aries actions
elizaLogger.info("Aries Protocol actions loaded successfully", {
    actionsCount: ariesActions.length,
});

export default ariesActions;
