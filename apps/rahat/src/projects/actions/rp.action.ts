import { MS_ACTIONS, ProjectJobs } from '@rahataid/sdk'
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types'

export const rpActions: ProjectActionFunc = {

  [MS_ACTIONS.RPPROJECT.GET_ALL_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.LIST_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.GET_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.FINDONE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.CREATE_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.CREATE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.UPDATE_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.UPDATE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.GET_ALL_DISBURSEMENT_PLAN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.LIST_DISBURSEMENT_PLAN, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.GET_DISBURSEMENT_PLAN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.FINDONE_DISBURSEMENT_PLAN, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.CREATE_DISBURSEMENT_PLAN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.CREATE_DISBURSEMENT_PLAN, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.UPDATE_DISBURSEMENT_PLAN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.UPDATE_DISBURSEMENT_PLAN, uuid },
      payload
    ),


  [MS_ACTIONS.RPPROJECT.CREATE_BULK_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.DISBURSEMENT_PLAN.CREATE_DISBURSEMENT, uuid },
      payload
    ),

}
