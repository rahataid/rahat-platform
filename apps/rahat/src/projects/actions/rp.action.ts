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
  //campaign start
  [MS_ACTIONS.RPPROJECT.CREATE_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.CREATE_CAMPAIGN, uuid },
      payload
    ),
  [MS_ACTIONS.RPPROJECT.GET_ALL_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.LIST_CAMPAIGN, uuid },
      payload
    ),
  [MS_ACTIONS.RPPROJECT.GET_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.FINDONE_CAMPAIGN, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.GET_ALL_AUDIENCE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_AUDIENCE, uuid },
      payload
    ),
  [MS_ACTIONS.RPPROJECT.GET_ALL_TRANSPORT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_TRANSPORT, uuid },
      payload
    ),

  [MS_ACTIONS.RPPROJECT.CREATE_AUDIENCE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.CREATE_AUDIENCE, uuid },
      payload
    ),
  [MS_ACTIONS.RPPROJECT.TRIGGER_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.TRIGGER_CAMPAIGN, uuid },
      payload
    ),
  [MS_ACTIONS.RPPROJECT.GET_ALL_COMMUNICATION_LOGS]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_COMMUNICATION_LOGS, uuid },
      payload
    ),
  [MS_ACTIONS.RPPROJECT.GET_ALL_COMMUNICATION_STATS]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_COMMUNICATION_STATS, uuid },
      payload
    ),
  //campaign end
}
