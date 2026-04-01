// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
/* eslint-disable */
export default {
  // displayName: { "rahat" },
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  collectCoverageFrom: [
    '<rootDir>/src/app/app.controller.ts',
    '<rootDir>/src/grievance/grievance.controller.ts',
    '<rootDir>/src/offramp/offramp.controller.ts',
    '<rootDir>/src/otp/otp.controller.ts',
    '<rootDir>/src/token/token.controller.ts',
    '<rootDir>/src/token/token.service.ts',
    '<rootDir>/src/wallet/wallet.controller.ts',
    '<rootDir>/src/utils/develop.service.ts',
    '<rootDir>/src/utils/fileUpload.ts',
    '<rootDir>/src/utils/qrGenerator.ts',
  ],
  coverageThreshold: {
    global: {
      lines: 70,
      statements: 70,
      functions: 30,
      branches: 60,
    },
  },
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/rahat',
};
