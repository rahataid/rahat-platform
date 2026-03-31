// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Test } from '@nestjs/testing';
import { PrismaService } from '@rumsan/prisma';

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  let prisma: PrismaService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: PrismaService,
          useValue: {
            authApp: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            setting: {
              findUnique: jest.fn(),
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
    prisma = app.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createAuthApps', () => {
    it('should create an auth app', async () => {
      const dto = { name: 'Test App', address: '0x123' } as any;
      const mockResult = { id: 1, ...dto };
      (prisma.authApp.create as jest.Mock).mockResolvedValue(mockResult);
      const result = await service.createAuthApps(dto);
      expect(result).toEqual(mockResult);
      expect(prisma.authApp.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('getAuthApp', () => {
    it('should return an auth app by uuid', async () => {
      const uuid = 'test-uuid' as any;
      const mockResult = { id: 1, uuid };
      (prisma.authApp.findUnique as jest.Mock).mockResolvedValue(mockResult);
      const result = await service.getAuthApp(uuid);
      expect(result).toEqual(mockResult);
      expect(prisma.authApp.findUnique).toHaveBeenCalledWith({ where: { uuid } });
    });
  });

  describe('softDeleteAuthApp', () => {
    it('should soft delete an auth app', async () => {
      const uuid = 'test-uuid' as any;
      const mockResult = { id: 1, uuid, deletedAt: new Date() };
      (prisma.authApp.update as jest.Mock).mockResolvedValue(mockResult);
      const result = await service.softDeleteAuthApp(uuid);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getCommunicationSettings', () => {
    it('should return communication settings', async () => {
      const mockResult = [{ id: 1, name: 'COMMUNICATION', value: {} }];
      (prisma.setting.findMany as jest.Mock).mockResolvedValue(mockResult);
      const result = await service.getCommunicationSettings();
      expect(result).toEqual(mockResult);
    });
  });
});
