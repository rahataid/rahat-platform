export * from './beneficiary';
export * from './project';
export * from './vendor';

export const APP_JOBS = {
  EMAIL: 'email',
  SLACK: 'slack',
  OTP: 'otp',
};

export const BQUEUE = {
  RAHAT: 'RAHAT',
  RAHAT_PROJECT: 'RAHAT.PROJECT',
  RAHAT_BENEFICIARY: 'RAHAT.BENEFICIARY',
  HOST: 'RAHAT.HOST',
};

export const APP = {
  BENEFICIARY: {
    TYPES: {
      REFERRED: 'REFERRED',
      ENROLLED: 'ENROLLED',
    },
  },
};
