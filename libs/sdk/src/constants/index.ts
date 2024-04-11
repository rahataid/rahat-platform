export const APP_JOBS = {
  EMAIL: 'email',
  SLACK: 'slack',
  OTP: 'otp',
};

export const MS_TIMEOUT = 500000;

export const BQUEUE = {
  RAHAT: 'RAHAT',
  RAHAT_PROJECT: 'RAHAT.PROJECT',
  RAHAT_BENEFICIARY: 'RAHAT.BENEFICIARY',
  HOST: 'RAHAT.HOST',
};

export const UserRoles = {
  ADMIN: 'Admin',
  USER: 'User',
  VENDOR: 'Vendor',
};

export const ACTIONS = {
  MANAGE: 'manage',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  READ: 'read',
};

export const SUBJECTS = {
  ALL: 'all',
  BENEFICIARY: 'beneficiary',
  PROJECT: 'project',
  VENDOR: 'vendor',
};

export const APP = {
  JWT_BEARER: 'JWT',
};

export const MS_ACTIONS = {
  BENEFICIARY: {
    CREATE: 'beneficiary.create',
    LIST: 'beneficiary.list',
    GET: 'beneficiary.get',
    DELETE: 'beneficiary.delete',
    ADD_TO_PROJECT: 'beneficiary.add_to_project',
    ASSGIN_TO_PROJECT: 'beneficiary.assign_to_project',
    BULK_ASSIGN_TO_PROJECT: 'beneficiary.bulk_assign',
    LIST_BY_PROJECT: 'beneficiary.list_by_project',
    GET_PROJECT_SPECIFIC: 'beneficiary.project_specific'
  },
  VENDOR: {
    REGISTER: 'vendor.register',
    ASSIGN_TO_PROJECT: 'vendor.assign_to_project',
    LIST_BY_PROJECT: 'vendor.list_by_project',
  },
  USER: {},
  ELPROJECT: {
    REDEEM_VOUCHER: 'elProject.redeemVoucher',
    UPDATE_STATUS: 'elProject.updateStatus',
    PROCESS_OTP: 'elProject.processOtp',
    ASSIGN_DISCOUNT_VOUCHER: 'elProject.discountVoucher',
    REQUEST_REDEMPTION: 'elProject.requestRedemption',
    REQUEST_REDEMPTION_BE: 'elProject.requestRedemption_be',
    UPDATE_REDEMPTION: 'elProject.updateRedemption',
    LIST_REDEMPTION: 'elProject.listRedemption',
    GET_VENDOR_REDEMPTION: 'elProject.vendorRedemption',
    GET_VENDOR_REFERRER: 'elProject.beneficiaryReferred',
    LIST_BEN_VENDOR_COUNT: 'elProject.count_ben_vendor',
  },
  SETTINGS: {
    LIST: 'settings.list',
    GET: 'settings.get',
  },
  AAPROJECT: {
    RIVER_STATIONS: {
      GET_DHM: 'aaProject.riverStations.getDhm'
    },
    SCHEDULE: {
      DEV_ONLY: 'aaProject.schedule.devOnly',
      GET_ALL: 'aaProject.schedule.getAll',
      ADD: 'aaProject.schedule.add',
      REMOVE: 'aaProject.schedule.remove'
    }
  }
};
