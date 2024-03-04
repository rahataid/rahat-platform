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

export const JOBS = {
  EMAIL: 'email',
  SLACK: 'slack',
  OTP: 'otp',
  PROJECT_CREATE: 'project_create',
  SETTINGS: {
    CREATE: 'rahat.jobs.settings.create',
  },
  VENDOR: {
    REGISTER: 'jobs.vendor.register',
  },
};

export enum ServiceType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  WALLET = 'WALLET',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  FACEBOOK = 'FACEBOOK',
  TWITTER = 'TWITTER',
  GITHUB = 'GITHUB',
  LINKEDIN = 'LINKEDIN',
}
