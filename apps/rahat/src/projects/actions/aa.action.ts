
import {
  AAJobs,
  MS_ACTIONS
} from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

export const aaActions: ProjectActionFunc = {
  /***********************
   * Development Only
  *************************/
  [MS_ACTIONS.AAPROJECT.TRIGGERS.DEV_ONLY]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.DEV_ONLY, uuid }, payload),
  /************************/


  // **** triggers start ******//

  [MS_ACTIONS.AAPROJECT.TRIGGERS.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.TRIGGERS.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.TRIGGERS.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.TRIGGERS.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.TRIGGERS.GET_ONE, uuid }, payload),
  // **** triggers end ******//


  [MS_ACTIONS.AAPROJECT.RIVER_STATIONS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.RIVER_STATIONS.GET_DHM, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.WATER_LEVELS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.WATER_LEVELS.GET_DHM, uuid }, payload),

  // **** activities ******//
  [MS_ACTIONS.AAPROJECT.ACTIVITIES.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITIES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITIES.GET_ALL, uuid }, payload),

  // [MS_ACTIONS.AAPROJECT.ACTIVITIES.GET_ONE]: (uuid, payload, sendCommand) =>
  //   sendCommand({ cmd: AAJobs.ACTIVITIES.GET_ONE, uuid }, payload),
  // **** activities end ******//


  [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.GET_ALL, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.ACTIVITY_CATEGORIES.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.ACTIVITY_CATEGORIES.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.HAZARD_TYPES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.HAZARD_TYPES.GET_ALL, uuid }, {}),

  // communication
  [MS_ACTIONS.AAPROJECT.COMMUNICATION.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.COMMUNICATION.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.COMMUNICATION.TRIGGER]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.COMMUNICATION.TRIGGER, uuid }, payload),
  // communication

  // **** phases ******//
  [MS_ACTIONS.AAPROJECT.PHASES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PHASES.GET_ALL, uuid }, {}),

  [MS_ACTIONS.AAPROJECT.PHASES.GET_STATS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.PHASES.GET_STATS, uuid }, {}),
  // **** phases end ******//


  // **** stakeholders ******//
  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.ADD, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.REMOVE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.UPDATE, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.GET_ALL, uuid }, payload),

  // **** stakeholders end ******//


  // **** stakeholders gtoups ******//
  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.GET_ALL_GROUPS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.GET_ALL_GROUPS, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.ADD_GROUP]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.ADD_GROUP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.UPDATE_GROUP]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.UPDATE_GROUP, uuid }, payload),

  [MS_ACTIONS.AAPROJECT.STAKEHOLDERS.DELETE_GROUP]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: AAJobs.STAKEHOLDERS.DELETE_GROUP, uuid }, payload),
  // **** stakeholders groups end ******//


};
