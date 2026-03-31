// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Test, TestingModule } from '@nestjs/testing';
import { AbilitiesGuard, JwtGuard } from '@rumsan/user';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;
  let controller: AppController;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getCommunicationSettings: jest.fn(),
            listAuthApps: jest.fn(),
            createAuthApps: jest.fn(),
            getAuthApp: jest.fn(),
            updateAuthApp: jest.fn(),
            softDeleteAuthApp: jest.fn(),
            getByAddress: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AbilitiesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = app.get<AppController>(AppController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listAuthApps', () => {
    it('should call service.listAuthApps', async () => {
      const service = app.get<AppService>(AppService);
      const mockResult = { data: [] };
      (service.listAuthApps as jest.Mock).mockResolvedValue(mockResult);
      const result = await controller.listAuthApps({} as any);
      expect(result).toEqual(mockResult);
    });
  });
});
