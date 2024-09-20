
import {
  MS_ACTIONS
} from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

const JOBS = {
  CHW: {
    CREATE: 'rahat.jobs.chw.create',
    LIST: 'rahat.jobs.chw.list',
    GET: 'rahat.jobs.chw.get',
    UPDATE: 'rahat.jobs.chw.update',
  }
}

export const cambodiaActions: ProjectActionFunc = {

  [MS_ACTIONS.CHW.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: JOBS.CHW.CREATE, uuid },
      payload),

  [MS_ACTIONS.CHW.LIST]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: JOBS.CHW.LIST, uuid },
      payload),

  [MS_ACTIONS.CHW.GET]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: JOBS.CHW.GET, uuid },
      payload),
  [MS_ACTIONS.CHW.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand(
      { cmd: JOBS.CHW.UPDATE, uuid },
      payload),

};
