export const JOBS = {
  RIVER_STATIONS: {
    GET_DHM: 'aa.jobs.riverStations.getDhm'
  },
  WATER_LEVELS: {
    GET_DHM: 'aa.jobs.waterLevels.getDhm'
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
    ADD: 'aa.jobs.activities.add',
    REMOVE: 'aa.jobs.activities.remove',
    UPDATE: 'aa.jobs.activities.update',
    UPDATE_STATUS: 'aa.jobs.activities.updateStatus',
  },
  ACTIVITY_CATEGORIES: {
    GET_ALL: 'aa.jobs.activityCategories.getAll',
    ADD: 'aa.jobs.activityCategories.add',
    REMOVE: 'aa.jobs.activityCategories.remove'
  },
  COMMUNICATION: {
    ADD: 'aa.jobs.activity.communication.add',
    TRIGGER: 'aa.jobs.activity.communication.trigger',
  },
  HAZARD_TYPES: {
    GET_ALL: 'aa.jobs.hazardTypes.getAll',
  },
  PHASES: {
    GET_ONE: 'aa.jobs.phases.getOne',
    GET_ALL: 'aa.jobs.phases.getAll',
    GET_STATS: 'aa.jobs.phases.getStats',
    ADD_TRIGGERS: 'aa.jobs.phases.addTriggers',
  },
  STAKEHOLDERS: {
    GET_ALL: 'aa.jobs.stakeholders.getAll',
    ADD: 'aa.jobs.stakeholders.add',
    REMOVE: 'aa.jobs.stakeholders.remove',
    UPDATE: 'aa.jobs.stakeholders.update',
    GET_GROUP: 'aa.jobs.stakeholders.getGroup',
    GET_ALL_GROUPS: 'aa.jobs.stakeholders.getAllGroups',
    ADD_GROUP: 'aa.jobs.stakeholders.addGroup',
    UPDATE_GROUP: 'aa.jobs.stakeholders.updateGroup',
    DELETE_GROUP: 'aa.jobs.stakeholders.deleteGroup'
  },
  BENEFICIARY: {
    ADD_GROUP: 'aa.jobs.beneficiary.addGroup',
    ASSIGN_TOKEN_TO_GROUP: 'aa.jobs.beneficiary.assign_token_to_group'
  },
  CONTRACT: {
    INCREASE_BUDGET: 'aa.jobs.contract.increaseBudget'
  }
};
