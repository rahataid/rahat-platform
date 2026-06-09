// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { ForbiddenException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateAuthAppDto, ListAuthAppsDto, UpdateAuthAppDto } from '@rahataid/extensions';
import { CreateSettingDto } from '@rumsan/extensions/dtos';
import { SettingsService } from '@rumsan/extensions/settings';
import { paginator, PaginatorTypes, PrismaService } from '@rumsan/prisma';
import { SettingDataType } from '@rumsan/sdk/enums';
import { UUID } from 'crypto';
import { SeedSettingsDto } from './dto/seed-settings.dto';

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

function getDataType(
  value: string | number | boolean | object,
): SettingDataType {
  if (typeof value === 'string') {
    return SettingDataType.STRING;
  } else if (typeof value === 'number') {
    return SettingDataType.NUMBER;
  } else if (typeof value === 'boolean') {
    return SettingDataType.BOOLEAN;
  } else if (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    return SettingDataType.OBJECT;
  }
  throw new Error(`Invalid data type for 'value': ${typeof value}`);
}


const LOCK_SETTING_NAME = 'SETTINGS_DYNAMIC_API_SUPPORT';

function normalizeRequiredFields(requiredFields: string | string[] | undefined): string[] {
  if (Array.isArray(requiredFields)) return requiredFields.map(String);
  if (typeof requiredFields !== 'string') return [];
  const trimmed = requiredFields.trim();
  if (!trimmed || trimmed === '{}' || trimmed === '[]') return [];
  try {
    const parsed = JSON.parse(trimmed);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function parseSettingValue(value: unknown, dataType?: string): unknown {
  if (typeof value !== 'string') return value;
  if (dataType === 'OBJECT') {
    try { return JSON.parse(value); } catch { return value; }
  }
  if (dataType === 'NUMBER') {
    const n = Number(value);
    return Number.isNaN(n) ? value : n;
  }
  if (dataType === 'BOOLEAN') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return value;
}

@Injectable()
export class AppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2,
  ) { }


  // ========Auth app services==========
  async createAuthApps(dto: CreateAuthAppDto) {
    return this.prisma.authApp.create({
      data: dto
    })
  }

  async listAuthApps(query: ListAuthAppsDto) {
    let filter = {};
    if (query.name) {
      filter = {
        name: {
          contains: query.name,
          mode: 'insensitive'
        }
      }
    }
    return paginate(
      this.prisma.authApp,
      {
        where: filter,
      },
      {
        page: query.page,
        perPage: query.perPage,
      }
    );
  }


  async getAuthApp(uuid: UUID) {
    return this.prisma.authApp.findUnique({
      where: { uuid }
    })
  }

  async getByAddress(address: string) {
    const row = await this.prisma.authApp.findUnique({
      where: { address, deletedAt: null }
    });
    if (!row) return null;
    // Generate and update nonce message
    const nonceMessage = new Date().getTime().toString();
    return this.prisma.authApp.update({
      where: { address },
      data: { nonceMessage }
    });
  }

  async updateAuthApp(uuid: UUID, dto: UpdateAuthAppDto) {
    return this.prisma.authApp.update({
      where: { uuid },
      data: dto
    })
  }

  async softDeleteAuthApp(uuid: UUID) {
    return this.prisma.authApp.update({
      where: { uuid },
      data: {
        deletedAt: new Date()
      }
    })
  }

  // =====End of Auth app services==========

  async createRahatAppSettings(
    createSettingDto: CreateSettingDto,
  ) {
    let {
      name,
      value: dtoValue,
      requiredFields,
      isReadOnly,
      isPrivate,
    } = createSettingDto;
    let value: any = dtoValue;

    const requiredFieldsArray: string[] = requiredFields
      ? requiredFields.map((field) => field)
      : [];

    const dataType = getDataType(value);

    // Check if 'value' is an object and not an array or null
    if (dataType === SettingDataType.OBJECT) {
      // Use type assertion here to tell TypeScript that value is an object
      const rawValueObject = value as Record<string, any>;
      // No capitalization of keys of the 'value' object

      // Check if 'value' object has all the properties specified in 'requiredFields' (case-insensitive)
      if (requiredFieldsArray && requiredFieldsArray.length > 0) {
        value = Object.keys(value)
          .filter((key) => requiredFieldsArray.includes(key))
          .reduce((obj: any, key) => {
            obj[key] = value[key];
            return obj;
          }, {});

        const missingFields = requiredFieldsArray.filter((field) => {
          const matchingKey = Object.keys(value).find(
            (key) => key === field,
          );
          return !matchingKey;
        });

        if (missingFields.length > 0) {
          throw new Error(
            `Required fields missing in 'value' object: ${missingFields.join(
              ', ',
            )}`,
          ); // 400 Bad Request
        }
      }
    } else {
      // If 'value' is not an object, set 'requiredFields' to an empty array []
      requiredFields = [];
    }


    const existingSetting = await this.prisma.setting.findUnique({
      where: { name },
    });

    if (existingSetting) {
      throw new Error('Setting with this name already exists'); // 400 Bad Request
    }
    const newSetting = await this.prisma.setting.create({
      data: {
        name,
        value,
        dataType,
        requiredFields: requiredFieldsArray,
        isReadOnly,
        isPrivate,
      },
    });

    return newSetting;
  }

  async seedSettings(dto: SeedSettingsDto) {
    const lockRecord = await this.prisma.setting.findUnique({ where: { name: LOCK_SETTING_NAME } });

    if (lockRecord && (lockRecord.value as string) === 'LOCKED') {
      throw new ForbiddenException('Settings already seeded. API is locked.');
    }

    let seededCount = 0;
    for (const item of dto.settings) {
      const parsedValue = parseSettingValue(item.value, item.dataType);
      const detectedDataType = item.dataType ?? getDataType(parsedValue as string | number | boolean | object);
      const requiredFields = normalizeRequiredFields(item.requiredFields);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbValue = parsedValue as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dbDataType = detectedDataType as any;
      await this.prisma.setting.upsert({
        where: { name: item.name.toUpperCase() },
        update: { value: dbValue, dataType: dbDataType, requiredFields, isReadOnly: item.isReadOnly ?? false, isPrivate: item.isPrivate ?? false },
        create: { name: item.name.toUpperCase(), value: dbValue, dataType: dbDataType, requiredFields, isReadOnly: item.isReadOnly ?? false, isPrivate: item.isPrivate ?? false },
      });
      seededCount++;
    }

    await this.prisma.setting.upsert({
      where: { name: LOCK_SETTING_NAME },
      update: { value: 'LOCKED' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      create: { name: LOCK_SETTING_NAME, value: 'LOCKED', dataType: 'STRING' as any, requiredFields: [], isReadOnly: true, isPrivate: false },
    });

    await this.settingsService.load();
    this.eventEmitter.emit('settings.seeded');

    return { seeded: seededCount, status: 'LOCKED' };
  }

  async getCommunicationSettings() {
    return this.prisma.setting.findMany({
      where: {
        name: "COMMUNICATION"
      }
    })
  }
}
