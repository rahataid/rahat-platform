export const JOBS = {
  RIVER_STATIONS: {
    GET_DHM: 'aa.jobs.riverStations.getDhm',
  },
  WATER_LEVELS: {
    GET_DHM: 'aa.jobs.waterLevels.getDhm',
    GET_GLOFAS: 'aa.jobs.waterLevels.getGlofas',
  },
  TRIGGERS: {
    DEV_ONLY: 'aa.jobs.triggers.devOnly',
    GET_ALL: 'aa.jobs.triggers.getAll',
    GET_ONE: 'aa.jobs.triggers.getOne',
    ADD: 'aa.jobs.triggers.add',
    REMOVE: 'aa.jobs.triggers.remove',
    ACTIVATE: 'aa.jobs.triggers.activate',
  },
  ACTIVITIES: {
    GET_ONE: 'aa.jobs.activities.getOne',
    GET_ALL: 'aa.jobs.activities.getAll',
    GET_HAVING_COMMS: 'aa.jobs.activities.getHavingComms',
    ADD: 'aa.jobs.activities.add',
    REMOVE: 'aa.jobs.activities.remove',
    UPDATE: 'aa.jobs.activities.update',
    UPDATE_STATUS: 'aa.jobs.activities.updateStatus',
    COMMUNICATION: {
      TRIGGER: 'aa.jobs.activity.communication.trigger',
      SESSION_LOGS: 'aa.jobs.activities.communication.sessionLogs',
      RETRY_FAILED: 'aa.jobs.activities.communication.retryFailed',
      GET_STATS: 'aa.jobs.activities.communication.getStats',
    }
  },
  ACTIVITY_CATEGORIES: {
    GET_ALL: 'aa.jobs.activityCategories.getAll',
    ADD: 'aa.jobs.activityCategories.add',
    REMOVE: 'aa.jobs.activityCategories.remove',
  },
  HAZARD_TYPES: {
    GET_ALL: 'aa.jobs.hazardTypes.getAll',
  },
  PHASES: {
    GET_ONE: 'aa.jobs.phases.getOne',
    GET_ALL: 'aa.jobs.phases.getAll',
    GET_STATS: 'aa.jobs.phases.getStats',
    ADD_TRIGGERS: 'aa.jobs.phases.addTriggers',
    REVERT_PHASE: 'aa.jobs.phases.revertPhase',
  },
  STAKEHOLDERS: {
    GET_ALL: 'aa.jobs.stakeholders.getAll',
    ADD: 'aa.jobs.stakeholders.add',
    REMOVE: 'aa.jobs.stakeholders.remove',
    UPDATE: 'aa.jobs.stakeholders.update',
    GET_GROUP: 'aa.jobs.stakeholders.getGroup',
    GET_ALL_GROUPS: 'aa.jobs.stakeholders.getAllGroups',
    GET_ONE_GROUP: 'aa.jobs.stakeholders.getOneGroup',
    ADD_GROUP: 'aa.jobs.stakeholders.addGroup',
    UPDATE_GROUP: 'aa.jobs.stakeholders.updateGroup',
    DELETE_GROUP: 'aa.jobs.stakeholders.deleteGroup',
  },
  BENEFICIARY: {
    ADD_GROUP: 'aa.jobs.beneficiary.addGroup',
    RESERVE_TOKEN_TO_GROUP: 'aa.jobs.beneficiary.reserve_token_to_group',
    ASSIGN_TOKEN_TO_GROUP: 'aa.jobs.beneficiary.assign_token_to_group',
    GET_ALL_GROUPS: 'aa.jobs.beneficiary.getAllGroups',
    GET_ONE_GROUP: 'aa.jobs.beneficiary.getOneGroup',
    GET_ALL_TOKEN_RESERVATION: 'aa.jobs.beneficiary.getAllTokenReservation',
    GET_ONE_TOKEN_RESERVATION: 'aa.jobs.beneficiary.getOneTokenReservation',
    GET_RESERVATION_STATS: 'aa.jobs.beneficiary.getReservationStats',
  },
  CONTRACT: {
    INCREASE_BUDGET: 'aa.jobs.contract.increaseBudget',
  },
  STATS: {
    GET_ALL: 'aa.jobs.stats.getAll',
    GET_ONE: 'aa.jobs.stats.getOne',
  },
  DAILY_MONITORING: {
    ADD: 'aa.jobs.dailyMonitoring.add',
    GET_ALL: 'aa.jobs.dailyMonitoring.getAll',
    GET_ONE: 'aa.jobs.dailyMonitoring.getOne',
    UPDATE: 'aa.jobs.dailyMonitoring.update',
    REMOVE: 'aa.jobs.dailyMonitoring.remove',
  },
};
