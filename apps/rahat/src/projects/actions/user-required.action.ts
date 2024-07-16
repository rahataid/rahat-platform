import { MS_ACTIONS } from "@rahataid/sdk";

export const userRequiredActions = new Set([
    MS_ACTIONS.AAPROJECT.ACTIVITIES.UPDATE_STATUS,
    MS_ACTIONS.AAPROJECT.TRIGGERS.ACTIVATE,
    // Add other actions that require user payload here
]);
