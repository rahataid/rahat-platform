
import {
  AAJobs,
  MS_ACTIONS
} from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

export const aaActions: ProjectActionFunc = {
  /***********************
   * Development Only
  *************************/
  [MS_ACTIONS.AAPROJECT.SCHEDULE.DEV_ONLY]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.SCHEDULE.DEV_ONLY, uuid }, payload),
  /************************/

  [MS_ACTIONS.AAPROJECT.SCHEDULE.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.SCHEDULE.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.SCHEDULE.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.SCHEDULE.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.SCHEDULE.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.SCHEDULE.GET_ALL, uuid }, {}),

};
