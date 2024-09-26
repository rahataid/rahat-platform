
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
    LIST_BY_PROJECT: 'rahat.jobs.beneficiary.list_by_project',
    GET: 'rahat.jobs.beneficiary.get',
    LIST: 'rahat.jobs.beneficiary.list',
  },
  VENDOR: {
    CREATE: 'rahat.jobs.vendor.create',
    LIST: 'rahat.jobs.vendor.list',
    GET: 'rahat.jobs.vendor.get',
    UPDATE: 'rahat.jobs.vendor.update',
    ADD_TO_PROJECT: 'rahat.jobs.vendor.add_to_project',
    UPDATE_IS_VERIFIED: 'rahat.jobs.vendor.update_is_verified',
    LIST_BY_PROJECT: 'rahat.jobs.vendor.list_by_project',
  }
}

export const cambodiaActions: ProjectActionFunc = {

  [MS_ACTIONS.CAMBODIA.VENDOR.UPDATE_IS_VERIFIED]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.VENDOR.UPDATE_IS_VERIFIED, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.VENDOR.ASSIGN_TO_PROJECT]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.VENDOR.ADD_TO_PROJECT, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.VENDOR.LIST]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.VENDOR.LIST, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.VENDOR.GET]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.VENDOR.GET, uuid },
      payload),


  [MS_ACTIONS.CAMBODIA.BENEFICIARY.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.BENEFICIARY.CREATE, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.BENEFICIARY.LIST]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.BENEFICIARY.LIST, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.BENEFICIARY.GET]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.BENEFICIARY.GET, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.CHW.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.CREATE, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.CHW.LIST]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.LIST, uuid },
      payload),

  [MS_ACTIONS.CAMBODIA.CHW.GET]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.GET, uuid },
      payload),
  [MS_ACTIONS.CAMBODIA.CHW.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.UPDATE, uuid },
      payload),
  [MS_ACTIONS.CAMBODIA.CHW.DELETE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: CAMBODIA_JOBS.CHW.DELETE, uuid },
      payload),
};
