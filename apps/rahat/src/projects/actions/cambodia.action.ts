
import {
  MS_ACTIONS
} from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

export const CAMBODIA_JOBS = {
  CHW: {
    CREATE: 'rahat.jobs.chw.create',
    LIST: 'rahat.jobs.chw.list',
    GET: 'rahat.jobs.chw.get',
    UPDATE: 'rahat.jobs.chw.update',
    DELETE: 'rahat.jobs.chw.delete',
  },
  BENEFICIARY: {
    CREATE: 'rahat.jobs.beneficiary.create',
    LIST: 'rahat.jobs.beneficiary.list',
    GET: 'rahat.jobs.beneficiary.get',
  },
  VENDOR: {
    CREATE: 'rahat.jobs.vendor.create',
    LIST: 'rahat.jobs.vendor.list',
    GET: 'rahat.jobs.vendor.get',
    UPDATE: 'rahat.jobs.vendor.update',
    ADD_TO_PROJECT: 'rahat.jobs.vendor.add_to_project',
    UPDATE_IS_VERIFIED: 'rahat.jobs.vendor.update_is_verified',
  }
}

export const cambodiaActions: ProjectActionFunc = {

  [MS_ACTIONS.VENDOR.UPDATE_IS_VERIFIED]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.VENDOR.UPDATE_IS_VERIFIED, uuid },
      payload),

  [MS_ACTIONS.VENDOR.ASSIGN_TO_PROJECT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.VENDOR.ADD_TO_PROJECT, uuid },
      payload),


  [MS_ACTIONS.BENEFICIARY.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.BENEFICIARY.CREATE, uuid },
      payload),

  [MS_ACTIONS.BENEFICIARY.LIST]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.BENEFICIARY.LIST, uuid },
      payload),

  [MS_ACTIONS.BENEFICIARY.GET]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.BENEFICIARY.GET, uuid },
      payload),

  [MS_ACTIONS.CHW.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.CREATE, uuid },
      payload),

  [MS_ACTIONS.CHW.LIST]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.LIST, uuid },
      payload),

  [MS_ACTIONS.CHW.GET]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.GET, uuid },
      payload),
  [MS_ACTIONS.CHW.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.UPDATE, uuid },
      payload),
  [MS_ACTIONS.CHW.DELETE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.DELETE, uuid },
      payload),
};
