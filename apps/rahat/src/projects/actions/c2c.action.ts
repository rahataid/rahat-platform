import { BeneficiaryJobs, MS_ACTIONS, ProjectJobs } from '@rahataid/sdk'
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
      payload
    ),

  [MS_ACTIONS.C2CProject.GET_ALL_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.LIST_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.C2CProject.GET_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.LISTONE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.C2CProject.CREATE_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.CREATE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.C2CProject.UPDATE_DISBURSEMENT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.UPDATE_DISBURSEMENT, uuid },
      payload
    ),

  [MS_ACTIONS.C2CProject.GET_DISBURSEMENT_TRANSACTIONS]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.GET_DISBURSEMENT_TRANSACTIONS, uuid },
      payload,

    ),

  [MS_ACTIONS.C2CProject.GET_DISBURESEMENT_APPROVALS]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.GET_DISBURSEMENT_APPROVALS, uuid },
      payload,
      500000
    ),

  [MS_ACTIONS.C2CProject.CREATE_SAFE_TRANSACTION]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.CREATE_SAFE_TRANSACTION, uuid },
      payload,
      500000
    ),

  [MS_ACTIONS.C2CProject.GET_SAFE_TRANSACTION]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.GET_SAFE_TRANSACTION, uuid },
      payload,
      500000
    ),

  [MS_ACTIONS.C2CProject.GET_SAFE_PENDING]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.GET_SAFE_PENDING, uuid },
      payload,
      500000
    ),



  //campaign start
  [MS_ACTIONS.C2CProject.CREATE_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.CREATE_CAMPAIGN, uuid },
      payload
    ),
  [MS_ACTIONS.C2CProject.GET_ALL_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.LIST_CAMPAIGN, uuid },
      payload
    ),
  [MS_ACTIONS.C2CProject.GET_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.FINDONE_CAMPAIGN, uuid },
      payload
    ),

  [MS_ACTIONS.C2CProject.GET_ALL_AUDIENCE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_AUDIENCE, uuid },
      payload
    ),


  [MS_ACTIONS.C2CProject.CREATE_AUDIENCE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.CREATE_AUDIENCE, uuid },
      payload
    ),
  [MS_ACTIONS.C2CProject.TRIGGER_CAMPAIGN]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.TRIGGER_CAMPAIGN, uuid },
      payload
    ),
  [MS_ACTIONS.C2CProject.GET_ALL_COMMUNICATION_LOGS]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_COMMUNICATION_LOGS, uuid },
      payload
    ),
  [MS_ACTIONS.C2CProject.GET_ALL_COMMUNICATION_STATS]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_COMMUNICATION_STATS, uuid },
      payload
    ),
  [MS_ACTIONS.C2CProject.GET_ALL_TRANSPORT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.CAMPAIGN.GET_ALL_TRANSPORT, uuid },
      payload
    ),
  //campaign end
}
