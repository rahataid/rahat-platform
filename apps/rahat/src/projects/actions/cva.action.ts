import { MS_ACTIONS, ProjectJobs } from "@rahataid/sdk";
import { ProjectActionFunc } from "@rahataid/sdk/project/project.types";

export const cvaActions: ProjectActionFunc = {

  [MS_ACTIONS.CVAProject.REQUEST_CLAIM]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.REQUEST_CLAIM, uuid },
      payload,
      500000
    ),

}
