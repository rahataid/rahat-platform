
import {
  BeneficiaryJobs,
  MS_ACTIONS,
  ProjectJobs
} from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

export const elActions: ProjectActionFunc = {
  [MS_ACTIONS.SETTINGS.LIST]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: ProjectJobs.PROJECT_SETTINGS_LIST, uuid }, {}),
  [MS_ACTIONS.SETTINGS.GET]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.PROJECT_SETTINGS_GET, uuid },
      payload
    ),
  //  [MS_ACTIONS.ELPROJECT.REDEEM_VOUCHER]: () =>
  // this.sendCommand({ cmd: ProjectJobs.REDEEM_VOUCHER, uuid }, payload),
  // [MS_ACTIONS.ELPROJECT.PROCESS_OTP]: () =>
  //   this.sendCommand({ cmd: ProjectJobs.PROCESS_OTP, uuid }, payload),

  // this.sendCommand(
  //   { cmd: ProjectJobs.ASSIGN_DISCOUNT_VOUCHER, uuid },
  //   payload
  // ),

  [MS_ACTIONS.ELPROJECT.UPDATE_STATUS]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.REDEEM_VOUCHER, uuid },
      payload),

  [MS_ACTIONS.ELPROJECT.REQUEST_REDEMPTION_BE]: async (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.REQUEST_REDEMPTION, uuid },
      payload,
      500000
    ),

  // this.sendCommand(
  //   { cmd: ProjectJobs.REQUEST_REDEMPTION, uuid },
  //   payload,
  //   500000
  // ),

  [MS_ACTIONS.ELPROJECT.UPDATE_REDEMPTION]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.UPDATE_REDEMPTION, uuid },
      payload,
      500000
    ),
  [MS_ACTIONS.ELPROJECT.LIST_REDEMPTION]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.LIST_REDEMPTION, uuid },
      payload,
      500000
    ),
  [MS_ACTIONS.ELPROJECT.GET_VENDOR_REDEMPTION]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: ProjectJobs.GET_VENDOR_REDEMPTION, uuid },
      payload,
      500000
    ),

  [MS_ACTIONS.ELPROJECT.LIST_BEN_VENDOR_COUNT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.LIST_BEN_VENDOR_COUNT },
      { projectId: uuid },
      500000
    ),
};
