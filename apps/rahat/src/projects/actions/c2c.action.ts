import { BeneficiaryJobs, MS_ACTIONS } from '@rahataid/sdk'
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types'

export const c2cActions: ProjectActionFunc = {
  // [MS_ACTIONS.SETTINGS.LIST]: (uuid, payload, sendCommand) =>
  //   sendCommand({ cmd: ProjectJobs.PROJECT_SETTINGS_LIST, uuid }, {}),
  // [MS_ACTIONS.SETTINGS.GET]: (uuid, payload, sendCommand) =>
  //   sendCommand(
  //     { cmd: ProjectJobs.PROJECT_SETTINGS_GET, uuid },
  //     payload
  //   ),

  [MS_ACTIONS.C2CProject.LIST_BEN_COUNT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.LIST_BENEFICIARY_COUNT, uuid },
      payload,
      500000
    ),

}
