import { BeneficiaryJobs, MS_ACTIONS } from '@rahataid/sdk'
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types'

export const rpActions: ProjectActionFunc = {

  [MS_ACTIONS.RPPROJECT.GET_ALL_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.LIST_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.GET_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.LISTONE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.CREATE_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.CREATE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.UPDATE_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.UPDATE_DISBURSEMENT, uuid },
      payload
    ),


}
