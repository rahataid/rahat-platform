import { MS_ACTIONS, ProjectJobs } from "@rahataid/sdk";
import { ProjectActionFunc } from "@rahataid/sdk/project/project.types";

export const stellarActions: ProjectActionFunc = {
    [MS_ACTIONS.STELLAR_PROJECT.CREATE_DISBURSEMENT]: (uuid, payload, sendCommand) =>
        sendCommand(
            { cmd: ProjectJobs.STELLAR.CREATE_DISBURSEMENT, uuid },
            payload
        ),
    [MS_ACTIONS.STELLAR_PROJECT.SEND_OTP]: (uuid, payload, sendCommand) =>
        sendCommand(
            { cmd: ProjectJobs.STELLAR.SEND_OTP, uuid },
            payload
        ),
    [MS_ACTIONS.STELLAR_PROJECT.VERIFY_OTP]: (uuid, payload, sendCommand) =>
        sendCommand(
            { cmd: ProjectJobs.STELLAR.VERIFY_OTP, uuid },
            payload
        ),
}