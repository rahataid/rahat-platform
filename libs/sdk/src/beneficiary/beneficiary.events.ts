export const EVENTS = {
  BENEFICIARY_CHANGED: 'beneficiary.changed',
  BENEFICIARY_CREATED: 'beneficiary.created',
  BENEFICIARY_REMOVED: 'beneficiary.removed',
  BENEFICIARY_UPDATED: 'beneficiary.updated',
  BENEFICIARY_ASSIGNED_TO_PROJECT: 'beneficiary.projectAssigned',
};

export const JOBS = {
  LIST_PII: 'rahat.jobs.beneficiary.list_pii',
  CREATE: 'rahat.jobs.beneficiary.create',
  CREATE_BULK: 'rahat.jobs.beneficiary.create_bulk',
  GET: 'rahat.jobs.beneficiary.get',
  GET_PROJECT_SPECIFIC: 'rahat.jobs.beneficiary.get_project_specific',
  GET_BY_WALLET: 'rahat.jobs.beneficiary.get_by_wallet',
  GET_BY_PHONE: 'rahat.jobs.beneficiary.get_by_phone',
  GET_TABLE_STATS: 'rahat.jobs.beneficiary.get_from_stats_table',
  LIST: 'rahat.jobs.beneficiary.list',
  REMOVE: 'rahat.jobs.beneficiary.remove',
  ADD_TO_PROJECT: 'rahat.jobs.beneficiary.add_to_project',
  ASSIGN_TO_PROJECT: 'rahat.jobs.beneficiary.assign_to_project',
  BULK_ASSIGN_TO_PROJECT: 'rahat.jobs.beneficiary.bulk_assign',
  STATS: 'rahat.jobs.beneficiary.stats',
  PROJECT_STATS: 'rahat.jobs.beneficiary.project.stats',
  UPDATE: 'rahat.jobs.beneficiary.update',
  UPDATE_STATS: 'rahat.jobs.beneficiary.update_stats',
  GENERATE_LINK: 'rahat.jobs.beneficiary.generate_link',
  SEND_EMAIL: 'rahat.jobs.beneficiary.send_email',
  VALIDATE_WALLET: 'rahat.jobs.beneficiary.validate_wallet',
  VERIFY_SIGNATURE: 'rahat.jobs.beneficiary.verify_signature',
  LIST_BY_PROJECT: 'rahat.jobs.beneficiary.list_by_project',
  VENDOR_REFERRAL: 'rahat.jobs.beneficiary.get_referred',
  LIST_REFERRAL: 'rahat.jobs.beneficiary.list_referred',
  LIST_BEN_VENDOR_COUNT: 'rahat.jobs.beneficiary.count_ben_vendor',
  LIST_BENEFICIARY_COUNT: 'rahat.jobs.beneficiary.count_beneficiary',
};
