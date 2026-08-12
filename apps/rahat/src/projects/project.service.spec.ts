import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { PrismaService } from '@rumsan/prisma';
import { ProjectService } from './project.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BQUEUE, ProjectEvents } from '@rahataid/sdk';
import { RequestContextService } from '../request-context/request-context.service';
import { randomUUID } from 'crypto';
import { ProjectStatus } from '@rahataid/sdk/enums';
import * as envConfig from '../utils/envConfig';

jest.mock('@nestjs/event-emitter', () => ({
  EventEmitter2: jest.fn().mockImplementation(() => ({
    emit: jest.fn(),
  })),
}));

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: PrismaService;
  let eventEmitter: EventEmitter2;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PrismaService,
          useValue: {
            project: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            setting: {
              findUnique: jest.fn(),
            },
          },
        },
        {
          provide: EventEmitter2,
          useValue: new (EventEmitter2 as any)(),
        },
        {
          provide: RequestContextService,
          useValue: {},
        },
        {
          provide: 'RAHAT_CLIENT',
          useValue: {
            send: jest.fn(),
            emit: jest.fn(),
          },
        },
        {
          provide: getQueueToken(BQUEUE.META_TXN),
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prisma = module.get<PrismaService>(PrismaService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  const mockResponse = [
    {
      id: 1,
      uuid: randomUUID(),
      name: 'Test Project 1',
      description: 'This is the description for Test Project 1.',
      status: 'NOT_READY',
      type: 'X',
      contractAddress: '0x00',
      extras: {
        test: 'test',
      },
      createdAt: '2024-09-02T11:59:25.229Z',
      updatedAt: '2024-09-02T11:59:25.229Z',
      deletedAt: null,
    },
    {
      id: 2,
      uuid: randomUUID(),
      name: 'Test Project 2',
      description: 'This is the description for Test Project 2.',
      status: 'NOT_READY',
      type: 'X',
      contractAddress: '0x00',
      extras: {
        test: 'test',
      },
      createdAt: '2024-09-02T11:59:25.229Z',
      updatedAt: '2024-09-02T11:59:25.229Z',
      deletedAt: null,
    },
  ];

  describe('create', () => {
    it('should create new project with required details', async () => {
      const mockRequest = {
        name: 'Test',
        description: 'This is description for testing.',
        type: 'X',
        extras: {
          test: 'test',
        },
        contractAddress: '0x00',
      };
      (prisma.project.create as jest.Mock).mockResolvedValue(mockRequest);
      const result = await service.create(mockRequest);
      expect(result).toBeDefined();
      expect(eventEmitter.emit).toHaveBeenCalledTimes(1);
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        ProjectEvents.PROJECT_CREATED,
        expect.any(Object)
      );
    });
  });

  describe('list', () => {
    it('should return list of projects', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockResponse);
      const result = await service.list();
      expect(result).toEqual(mockResponse);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return an empty list when no projects are found', async () => {
      (prisma.project.findMany as jest.Mock).mockResolvedValue(null);
      const result = await service.list();
      console.log(result, 'result in list');
      expect(result).toBeNull;
    });
  });

  describe('findOne', () => {
    it('should return specific project detail using uuid', async () => {
      (prisma.project.findUnique as jest.Mock).mockResolvedValue(
        mockResponse[0]
      );
      const result = await service.findOne(mockResponse[0].uuid);
      expect(prisma.project.findUnique).toHaveBeenCalledWith({
        where: {
          uuid: mockResponse[0].uuid,
        },
      });
      expect(result).toEqual(mockResponse[0]);
      expect(result).not.toBeNull();
      expect(result).not.toBeUndefined();
      expect(result).toHaveProperty('uuid');
    });
  });

  describe('update', () => {
    it('should update the details of the project using uuid', async () => {
      const mockRequest = {
        name: 'updated name',
        contractAddress: '0x11',
      };
      const mockResponseUpdate = {
        id: 2,
        uuid: randomUUID(),
        name: 'updated name',
        description: 'This is the description for Test Project 2.',
        status: 'NOT_READY',
        type: 'X',
        contractAddress: '0x11',
        extras: {
          test: 'test',
        },
        createdAt: '2024-09-02T11:59:25.229Z',
        updatedAt: '2024-09-02T11:59:25.229Z',
        deletedAt: null,
      };
      (prisma.project.update as jest.Mock).mockResolvedValue(
        mockResponseUpdate
      );
      const result = await service.update(mockResponseUpdate.uuid, mockRequest);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: {
          uuid: mockResponseUpdate.uuid,
        },
        data: mockRequest,
      });
      expect(result).toEqual(mockResponseUpdate);
      expect(result).not.toBeNull();
    });
  });

  describe('updateStatus', () => {
    it('should update the status of the specific project using uuid', async () => {
      const mockRequest = {
        status: ProjectStatus.ACTIVE,
        description: 'This is the description for Test Project 2.',
      };
      const mockResponseUpdate = {
        id: 2,
        uuid: randomUUID(),
        name: 'updated name',
        description: 'This is the description for Test Project 2.',
        status: 'ACTIVE',
        type: 'X',
        contractAddress: '0x11',
        extras: {
          test: 'test',
        },
        createdAt: '2024-09-02T11:59:25.229Z',
        updatedAt: '2024-09-02T11:59:25.229Z',
        deletedAt: null,
      };
      (prisma.project.update as jest.Mock).mockResolvedValue(
        mockResponseUpdate
      );
      const result = await service.update(mockResponseUpdate.uuid, mockRequest);
      expect(prisma.project.update).toHaveBeenCalledWith({
        where: {
          uuid: mockResponseUpdate.uuid,
        },
        data: mockRequest,
      });
      expect(result).toEqual(mockResponseUpdate);
      expect(result).not.toBeNull();
    });
  });

  describe('getKoboCountryCodeFromSettings', () => {
    afterEach(() => {
      jest.clearAllMocks();
    });

    it("should return the calling code stored under the setting's country key", async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        name: 'COUNTRY_CODE_SETTINGS',
        value: { CHINA: ' +86 ' },
      });
      const result = await service.getKoboCountryCodeFromSettings();
      expect(prisma.setting.findUnique).toHaveBeenCalledWith({
        where: { name: 'COUNTRY_CODE_SETTINGS' },
      });
      expect(result).toBe('+86');
    });

    it('should return an empty string when the setting does not exist', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.getKoboCountryCodeFromSettings();
      expect(result).toBe('');
    });

    it('should return the code when the setting is stored as a bare string', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        name: 'COUNTRY_CODE_SETTINGS',
        value: '86',
      });
      const result = await service.getKoboCountryCodeFromSettings();
      expect(result).toBe('86');
    });

    it('should skip values that do not look like a calling code', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        name: 'COUNTRY_CODE_SETTINGS',
        value: { NOTE: 'set by admin', CHINA: '+86' },
      });
      const result = await service.getKoboCountryCodeFromSettings();
      expect(result).toBe('+86');
    });

    it('should skip a value too long to be a calling code', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        name: 'COUNTRY_CODE_SETTINGS',
        value: { PHONE: '9779843777474', CHINA: '+86' },
      });
      const result = await service.getKoboCountryCodeFromSettings();
      expect(result).toBe('+86');
    });

    it('should return an empty string when the code is nested a level deeper', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        name: 'COUNTRY_CODE_SETTINGS',
        value: { DEFAULT: { CHINA: '+86' } },
      });
      const result = await service.getKoboCountryCodeFromSettings();
      expect(result).toBe('');
    });

    it('should return an empty string when the value has no string field', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        name: 'COUNTRY_CODE_SETTINGS',
        value: { PRIORITY: 1 },
      });
      const result = await service.getKoboCountryCodeFromSettings();
      expect(result).toBe('');
    });

    it('should return an empty string when the lookup throws', async () => {
      (prisma.setting.findUnique as jest.Mock).mockRejectedValue(
        new Error('db down')
      );
      const result = await service.getKoboCountryCodeFromSettings();
      expect(result).toBe('');
    });
  });

  describe('getKoboCountryCodeFromSettings caching', () => {
    afterEach(() => {
      jest.restoreAllMocks();
      jest.clearAllMocks();
    });

    it('should reuse the cached value on a second call within the TTL', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      const first = await service.getKoboCountryCodeFromSettings();
      const second = await service.getKoboCountryCodeFromSettings();
      expect(first).toBe('86');
      expect(second).toBe('86');
      expect(prisma.setting.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should keep serving the cache right up to the expiry instant', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      await service.getKoboCountryCodeFromSettings();
      nowSpy.mockReturnValue(
        1_000_000 + envConfig.COUNTRY_CODE_CACHE_TTL_MS - 1
      );
      await service.getKoboCountryCodeFromSettings();
      expect(prisma.setting.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should refetch once the cached value has expired', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      await service.getKoboCountryCodeFromSettings();
      nowSpy.mockReturnValue(
        1_000_000 + envConfig.COUNTRY_CODE_CACHE_TTL_MS + 1
      );
      await service.getKoboCountryCodeFromSettings();
      expect(prisma.setting.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should pick up a code that was configured after the cache expired', async () => {
      (prisma.setting.findUnique as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ value: { CHINA: '86' } });
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000);
      expect(await service.getKoboCountryCodeFromSettings()).toBe('');
      nowSpy.mockReturnValue(
        1_000_000 + envConfig.COUNTRY_CODE_CACHE_TTL_MS + 1
      );
      expect(await service.getKoboCountryCodeFromSettings()).toBe('86');
    });

    it('should cache an unset setting too, rather than querying on every import', async () => {
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);
      await service.getKoboCountryCodeFromSettings();
      await service.getKoboCountryCodeFromSettings();
      expect(prisma.setting.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should not cache a failed lookup, so the next call retries', async () => {
      (prisma.setting.findUnique as jest.Mock)
        .mockRejectedValueOnce(new Error('db down'))
        .mockResolvedValueOnce({ value: { CHINA: '86' } });
      const first = await service.getKoboCountryCodeFromSettings();
      const second = await service.getKoboCountryCodeFromSettings();
      expect(first).toBe('');
      expect(second).toBe('86');
      expect(prisma.setting.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('normalizeKoboPhone', () => {
    let originalAutoApply: boolean;

    beforeEach(() => {
      originalAutoApply = envConfig.AUTO_APPLY_KOBO_COUNTRY_CODE;
    });

    afterEach(() => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = originalAutoApply;
      jest.clearAllMocks();
    });

    it('should throw when phone is empty', async () => {
      await expect(service.normalizeKoboPhone('')).rejects.toThrow(
        'Phone number is required!'
      );
    });

    it('should only strip non-digits and prefix "+" when auto-apply is disabled', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = false;
      const result = await service.normalizeKoboPhone('0138 0000 1111');
      expect(result).toBe('+013800001111');
      expect(prisma.setting.findUnique).not.toHaveBeenCalled();
    });

    it('should leave a "+" prefixed phone untouched without reading the setting', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      const result = await service.normalizeKoboPhone('+8615012345678');
      expect(result).toBe('+8615012345678');
      expect(prisma.setting.findUnique).not.toHaveBeenCalled();
    });

    it('should prefix a local number written without a trunk zero', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      const result = await service.normalizeKoboPhone('13800001111');
      expect(result).toBe('+8613800001111');
    });

    it('should strip a leading trunk zero and prefix the configured calling code', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      const result = await service.normalizeKoboPhone('013800001111');
      expect(result).toBe('+8613800001111');
    });

    it('should not stack the configured code on a number that already starts with it', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '+86' },
      });
      const result = await service.normalizeKoboPhone('8615012345678');
      expect(result).toBe('+8615012345678');
    });

    it('should keep an international "00" prefixed number and drop the "00"', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '+86' },
      });
      const result = await service.normalizeKoboPhone('00977 9843777474');
      expect(result).toBe('+9779843777474');
      expect(prisma.setting.findUnique).not.toHaveBeenCalled();
    });

    it('should still apply the configured code to a local number', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '+86' },
      });
      const result = await service.normalizeKoboPhone('15012345678');
      expect(result).toBe('+8615012345678');
    });

    it('should strip formatting from a local number before prefixing', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      const result = await service.normalizeKoboPhone(' (0138) 0000-1111 ');
      expect(result).toBe('+8613800001111');
    });

    it('should keep a "+" number as-is even when it is another country', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '+86' },
      });
      const result = await service.normalizeKoboPhone('+9779843777474');
      expect(result).toBe('+9779843777474');
      expect(prisma.setting.findUnique).not.toHaveBeenCalled();
    });

    it('should read the setting once across repeated imports', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue({
        value: { CHINA: '86' },
      });
      await service.normalizeKoboPhone('013800001111');
      await service.normalizeKoboPhone('013800001112');
      expect(prisma.setting.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw when auto-apply is on but no country code is configured', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(service.normalizeKoboPhone('013800001111')).rejects.toThrow(
        'COUNTRY_CODE_SETTINGS'
      );
    });

    it('should throw when the setting lookup fails', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      (prisma.setting.findUnique as jest.Mock).mockRejectedValue(
        new Error('db down')
      );
      await expect(service.normalizeKoboPhone('013800001111')).rejects.toThrow(
        'COUNTRY_CODE_SETTINGS'
      );
    });

    it('should not throw when auto-apply is off and no code is configured', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = false;
      (prisma.setting.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await service.normalizeKoboPhone('013800001111');
      expect(result).toBe('+013800001111');
    });

    it('should throw when the phone is only formatting characters', async () => {
      (envConfig as any).AUTO_APPLY_KOBO_COUNTRY_CODE = true;
      await expect(service.normalizeKoboPhone('   ')).rejects.toThrow(
        'Phone number is required!'
      );
    });
  });
});
