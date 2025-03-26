import { MS_ACTIONS } from '@rahataid/sdk';
import { ProjectActionFunc } from '@rahataid/sdk/project/project.types';

export const MS_TRIGGERS_JOBS = {
  TRIGGER: {
    DEV_ONLY: 'ms.jobs.triggers.devOnly',
    GET_ALL: 'ms.jobs.triggers.getAll',
    GET_ONE: 'ms.jobs.triggers.getOne',
    ADD: 'ms.jobs.triggers.add',
    REMOVE: 'ms.jobs.triggers.remove',
    ACTIVATE: 'ms.jobs.triggers.activate',
    GET_BY_LOCATION: 'ms.jobs.triggers.getByLocation',
  },

  PHASES: {
    CREATE: 'ms.jobs.phases.create',
    GET_ONE: 'ms.jobs.phases.getOne',
    GET_ALL: 'ms.jobs.phases.getAll',
    GET_STATS: 'ms.jobs.phases.getStats',
    ADD_TRIGGERS: 'ms.jobs.phases.addTriggers',
    REVERT_PHASE: 'ms.jobs.phases.revertPhase',
    GET_BY_LOCATION: 'ms.jobs.phases.getByLocation',
  },
  RIVER_STATIONS: {
    GET_DHM: 'ms.jobs.riverStations.getDhm',
  },
  WATER_LEVELS: {
    GET_DHM: 'ms.jobs.waterLevels.getDhm',
    GET_GLOFAS: 'ms.jobs.waterLevels.getGlofas',
  },
  ACTIVITIES: {
    GET_ONE: 'ms.jobs.activities.getOne',
    GET_ALL: 'ms.jobs.activities.getAll',
    LIST_PROJECT_SPECIFIC: 'ms.jobs.activities.listProjectSpecific',
    GET_HAVING_COMMS: 'ms.jobs.activities.getHavingComms',
    ADD: 'ms.jobs.activities.add',
    REMOVE: 'ms.jobs.activities.remove',
    UPDATE: 'ms.jobs.activities.update',
    UPDATE_STATUS: 'ms.jobs.activities.updateStatus',
    COMMUNICATION: {
      TRIGGER: 'ms.jobs.activity.communication.trigger',
      SESSION_LOGS: 'ms.jobs.activities.communication.sessionLogs',
      // RETRY_FAILED: 'ms.jobs.activities.communication.retryFailed',
      GET_STATS: 'ms.jobs.activities.communication.getStats',
    },
  },

  CATEGORIES: {
    GET_ALL: 'ms.jobs.categories.getAll',
    ADD: 'ms.jobs.categories.add',
    REMOVE: 'ms.jobs.categories.remove',
  },
  DAILY_MONITORING: {
    ADD: 'ms.jobs.dailyMonitoring.add',
    GET_ALL: 'ms.jobs.dailyMonitoring.getAll',
    GET_ONE: 'ms.jobs.dailyMonitoring.getOne',
    UPDATE: 'ms.jobs.dailyMonitoring.update',
    REMOVE: 'ms.jobs.dailyMonitoring.remove',
  },
}


export const msTriggerActions: ProjectActionFunc = {

  ["triggers.try"]: (uuid, payload, sendCommand) => {
    return sendCommand({ cmd: "try.trigger" }, payload)
  },

  // **** triggers start ******//
  [MS_ACTIONS.MS_TRIGGERS.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.ADD }, payload),

  [MS_ACTIONS.MS_TRIGGERS.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.REMOVE }, payload),

  [MS_ACTIONS.MS_TRIGGERS.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.GET_ALL }, payload),

  [MS_ACTIONS.MS_TRIGGERS.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.GET_ONE }, payload),

  [MS_ACTIONS.MS_TRIGGERS.ACTIVATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.ACTIVATE }, payload),


  [MS_ACTIONS.MS_TRIGGERS.GET_BY_LOCATION]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.GET_BY_LOCATION }, payload),

  // **** triggers end ******//

  // // **** phases start ******//


  [MS_ACTIONS.MS_PHASES.CREATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.CREATE }, payload),

  [MS_ACTIONS.MS_PHASES.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.GET_ONE }, payload),

  [MS_ACTIONS.MS_PHASES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.GET_ALL }, payload),

  [MS_ACTIONS.MS_PHASES.GET_STATS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.GET_STATS }, payload),

  [MS_ACTIONS.MS_PHASES.ADD_TRIGGERS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.ADD_TRIGGERS }, payload),

  [MS_ACTIONS.MS_PHASES.REVERT_PHASE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.REVERT_PHASE }, payload),

  [MS_ACTIONS.MS_PHASES.GET_BY_LOCATION]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.GET_BY_LOCATION }, payload),

  // // **** phases end ******//


  // **** river stations start ******//

  [MS_ACTIONS.MS_RIVER_STATIONS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.RIVER_STATIONS.GET_DHM }, payload),

  [MS_ACTIONS.MS_WATER_LEVELS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.WATER_LEVELS.GET_DHM }, payload),

  [MS_ACTIONS.MS_WATER_LEVELS.GET_GLOFAS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.WATER_LEVELS.GET_GLOFAS }, payload),
  // **** river stations end ******//



  // **** activities start ******//
  [MS_ACTIONS.MS_ACTIVITIES.COMMUNICATION.SESSION_LOGS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.COMMUNICATION.SESSION_LOGS }, payload),


  // [MS_ACTIONS.MS_ACTIVITIES.COMMUNICATION.RETRY_FAILED]: (uuid, payload, sendCommand) =>
  //   sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.COMMUNICATION.RETRY_FAILED}, payload),

  // [MS_ACTIONS.MS_ACTIVITIES.COMMUNICATION.TRIGGER]: (uuid, payload, sendCommand) =>
  //   sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.COMMUNICATION.TRIGGER}, payload),

  [MS_ACTIONS.MS_ACTIVITIES.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.ADD }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.REMOVE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.REMOVE }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.GET_ALL }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.LIST_PROJECT_SPECIFIC]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.LIST_PROJECT_SPECIFIC }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.GET_HAVING_COMMS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.GET_HAVING_COMMS }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.GET_ONE }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.UPDATE_STATUS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.UPDATE_STATUS }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.UPDATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.UPDATE }, payload),

  [MS_ACTIONS.MS_ACTIVITIES.COMMUNICATION.GET_STATS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.ACTIVITIES.COMMUNICATION.GET_STATS }, payload),
  // **** activities end ******//




  // **** activity categories start ******//
  [MS_ACTIONS.MS_CATEGORIES.GET_ALL]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.CATEGORIES.GET_ALL }, payload),

  [MS_ACTIONS.MS_CATEGORIES.ADD]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.CATEGORIES.ADD }, payload),

  [MS_ACTIONS.MS_CATEGORIES.REMOVE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.CATEGORIES.REMOVE }, payload),

  // [MS_ACTIONS.AAPROJECT.HAZARD_TYPES.GET_ALL]: (uuid, payload, sendCommand) =>
  //   sendCommand({ cmd: AAJobs.HAZARD_TYPES.GET_ALL}, payload),
  // **** activity categories end ******//



  // **** daily monitoring start ****//

  [MS_ACTIONS.MS_DAILY_MONITORING.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.DAILY_MONITORING.ADD }, payload),

  [MS_ACTIONS.MS_DAILY_MONITORING.GET_ALL]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.DAILY_MONITORING.GET_ALL }, payload),

  [MS_ACTIONS.MS_DAILY_MONITORING.GET_ONE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.DAILY_MONITORING.GET_ONE }, payload),

  [MS_ACTIONS.MS_DAILY_MONITORING.UPDATE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.DAILY_MONITORING.UPDATE }, payload),

  [MS_ACTIONS.MS_DAILY_MONITORING.REMOVE]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.DAILY_MONITORING.REMOVE }, payload),
  // **** daily monitoring end ****//
};
