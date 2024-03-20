export const EVENTS = {
  BENEFICIARY_CHANGED: 'beneficiary.changed',
  BENEFICIARY_CREATED: 'beneficiary.created',
  BENEFICIARY_REMOVED: 'beneficiary.removed',
  BENEFICIARY_UPDATED: 'beneficiary.updated',
};

export const JOBS = {
  LIST_PII: 'rahat.jobs.beneficiary.list_pii',
  CREATE: 'rahat.jobs.beneficiary.create',
  CREATE_BULK: 'rahat.jobs.beneficiary.create_bulk',
  GET: 'rahat.jobs.beneficiary.get',
  LIST: 'rahat.jobs.beneficiary.list',
  REMOVE: 'rahat.jobs.beneficiary.remove',
  ADD_TO_PROJECT: 'rahat.jobs.beneficiary.add_to_project',
  ASSIGN_TO_PROJECT:'rahat.jobs.beneficiary.assign_to_project',
  BULK_ASSIGN_TO_PROJECT:'rahat.jobs.beneficiary.bulk_assign',
  STATS: 'rahat.jobs.beneficiary.stats',
  UPDATE: 'rahat.jobs.beneficiary.update',
  UPDATE_STATS: 'rahat.jobs.beneficiary.update_stats',
  GENERATE_LINK: 'rahat.jobs.beneficiary.generate_link',
  SEND_EMAIL: 'rahat.jobs.beneficiary.send_email',
  VALIDATE_WALLET: 'rahat.jobs.beneficiary.validate_wallet',
  VERIFY_SIGNATURE: 'rahat.jobs.beneficiary.verify_signature',
  LIST_BY_PROJECT: 'rahat.jobs.beneficiary.list_by_project',
};
