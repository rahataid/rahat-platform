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
    GET_ONE: 'ms.jobs.phases.getOne',
    GET_ALL: 'ms.jobs.phases.getAll',
    GET_STATS: 'ms.jobs.phases.getStats',
    ADD_TRIGGERS: 'ms.jobs.phases.addTriggers',
    REVERT_PHASE: 'ms.jobs.phases.revertPhase',
  },
  RIVER_STATIONS: {
    GET_DHM: 'ms.jobs.riverStations.getDhm',
  },
  WATER_LEVELS: {
    GET_DHM: 'ms.jobs.waterLevels.getDhm',
    GET_GLOFAS: 'ms.jobs.waterLevels.getGlofas',
  },
}


export const msTriggerActions: ProjectActionFunc = {

  ["triggers.add"]: (uuid, payload, sendCommand) => sendCommand({ cmd: "test.trigger", uuid: "a83e3867-de4b-4c20-b955-3d84875bc423" }, payload),

  // **** triggers start ******//
  [MS_ACTIONS.MS_TRIGGERS.ADD]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.ADD, uuid }, payload),

  [MS_ACTIONS.MS_TRIGGERS.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.GET_ALL, uuid }, payload),

  [MS_ACTIONS.MS_TRIGGERS.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.GET_ONE, uuid }, payload),

  [MS_ACTIONS.MS_TRIGGERS.ACTIVATE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.TRIGGER.ACTIVATE, uuid }, payload),

  // **** triggers end ******//

  // // **** phases start ******//
  [MS_ACTIONS.MS_PHASES.GET_ONE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.GET_ONE, uuid }, payload),

  [MS_ACTIONS.MS_PHASES.GET_ALL]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.GET_ALL, uuid }, payload),

  [MS_ACTIONS.MS_PHASES.GET_STATS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.GET_STATS, uuid }, payload),

  [MS_ACTIONS.MS_PHASES.ADD_TRIGGERS]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.ADD_TRIGGERS, uuid }, payload),

  [MS_ACTIONS.MS_PHASES.REVERT_PHASE]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.PHASES.REVERT_PHASE, uuid }, payload),
  // // **** phases end ******//


  // **** river stations start ******//

  [MS_ACTIONS.MS_RIVER_STATIONS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.RIVER_STATIONS.GET_DHM, uuid }, payload),

  [MS_ACTIONS.MS_WATER_LEVELS.GET_DHM]: (uuid, payload, sendCommand) =>
    sendCommand({ cmd: MS_TRIGGERS_JOBS.WATER_LEVELS.GET_DHM, uuid }, payload),

  [MS_ACTIONS.MS_WATER_LEVELS.GET_GLOFAS]: (
    uuid,
    payload,
    sendCommand
  ) => sendCommand({ cmd: MS_TRIGGERS_JOBS.WATER_LEVELS.GET_GLOFAS, uuid }, payload),
  // **** river stations end ******//
};
