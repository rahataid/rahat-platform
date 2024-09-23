
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
  }
}

export const cambodiaActions: ProjectActionFunc = {

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
