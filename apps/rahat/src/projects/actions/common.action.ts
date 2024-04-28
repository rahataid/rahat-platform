import {
  BeneficiaryJobs,
  MS_ACTIONS,
  VendorJobs
} from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';
export const beneficiaryActions: ProjectActionFunc = {
  [MS_ACTIONS.BENEFICIARY.ADD_TO_PROJECT]: (uuid, payload, sendCommand) => {
    return sendCommand(
      { cmd: BeneficiaryJobs.ADD_TO_PROJECT },
      { dto: payload, projectUid: uuid }
    )
  },
  [MS_ACTIONS.BENEFICIARY.ASSGIN_TO_PROJECT]: (uuid, payload, sendCommand) => {
    return sendCommand(
      { cmd: BeneficiaryJobs.ASSIGN_TO_PROJECT },
      { projectId: uuid, ...payload }

    )
  },
  [MS_ACTIONS.BENEFICIARY.BULK_ASSIGN_TO_PROJECT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.BULK_ASSIGN_TO_PROJECT },
      { projectId: uuid, ...payload }
    ),
  [MS_ACTIONS.BENEFICIARY.LIST_BY_PROJECT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.LIST_BY_PROJECT },
      { projectId: uuid, ...payload }
    ),
  [MS_ACTIONS.BENEFICIARY.GET_PROJECT_SPECIFIC]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.GET_PROJECT_SPECIFIC },
      { projectId: uuid, ...payload }
    ),
  [MS_ACTIONS.ELPROJECT.GET_VENDOR_REFERRER]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: BeneficiaryJobs.VENDOR_REFERRAL, uuid },
      payload,
      50000
    ),
};

export const vendorActions: ProjectActionFunc = {
  [MS_ACTIONS.VENDOR.ASSIGN_TO_PROJECT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: VendorJobs.ASSIGN_PROJECT },
      { projectId: uuid, ...payload }
    ),
  [MS_ACTIONS.VENDOR.LIST_BY_PROJECT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: VendorJobs.LIST_BY_PROJECT },
      { projectId: uuid, ...payload }
    ),
};
