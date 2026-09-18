// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BadRequestException, ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, timeout } from 'rxjs/operators';
import { firstValueFrom, of } from 'rxjs';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateAuthAppDto, ListAuthAppsDto, UpdateAuthAppDto } from '@rahataid/extensions';
import { CreateSettingDto } from '@rumsan/extensions/dtos';
import { SettingsService } from '@rumsan/extensions/settings';
import { paginator, PaginatorTypes, PrismaService } from '@rumsan/prisma';
import { SettingDataType } from '@rumsan/sdk/enums';
import { UUID } from 'crypto';
import { SeedSettingsDto } from './dto/seed-settings.dto';
import { AppVersionsDto, ServiceVersionDto } from './dto/app-versions.dto';
import { getVersionFromPackageJson } from '../utils/version.helper';
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
  throw new BadRequestException({
    message: `Invalid data type for 'value': ${typeof value}`,
    code: 'SETTING_INVALID_VALUE_DATA_TYPE',
    params: { dataType: typeof value },
  });
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
  private readonly logger = new Logger(AppService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    @Inject('RAHAT_CLIENT') private readonly rahatClient: ClientProxy,
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
          throw new BadRequestException({
            message: `Required fields missing in 'value' object: ${missingFields.join(
              ', ',
            )}`,
            code: 'SETTING_REQUIRED_FIELDS_MISSING',
            params: { fields: missingFields.join(', ') },
          }); // 400 Bad Request
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
      throw new BadRequestException({
        message: 'Setting with this name already exists',
        code: 'SETTING_NAME_ALREADY_EXISTS',
      }); // 400 Bad Request
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
      throw new ForbiddenException({
        message: 'Settings already seeded. API is locked.',
        code: 'SETTINGS_ALREADY_SEEDED_API_LOCKED',
      });
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

  async getFrontendUrl() {
    return this.prisma.setting.findMany({
      where: {
        name: "FRONTEND_URL"
      }
    })
  }

  // Returns the platform version from package.json.
  private async getRahatVersion(): Promise<string> {
    return getVersionFromPackageJson();
  }

  // Returns the current runtime environment.
  private resolveEnv(): string | null {
    return this.configService.get<string>('NODE_ENV') || null;
  }

  // Fetches the AA service version via Redis.
  private async getAaVersion(): Promise<ServiceVersionDto> {
    const start = Date.now();
    const result: any = await firstValueFrom(
      this.rahatClient
        // cspell:disable-next-line
        .send({ cmd: 'aa.jobs.version.get' }, {})
        .pipe(
          timeout(1500),
          catchError((err: Error) => {
            this.logger.warn(`AA version fetch failed (${err.message}) — fallback unreachable`);
            return of(null);
          }),
        ),
    );
    if (result?.version) this.logger.log(`AA version ${result.version} in ${Date.now() - start}ms`);
    return { version: result?.version || 'unreachable', env: result?.env ?? null };
  }

  // Fetches the Triggers service version via Redis.
  private async getTriggersVersion(): Promise<ServiceVersionDto> {
    const result: any = await firstValueFrom(
      this.rahatClient
        // cspell:disable-next-line
        .send({ cmd: 'ms.jobs.version.get' }, { appId: process.env.AA_PROJECT_ID } as any)
        .pipe(
          timeout(1500),
          catchError((err: Error) => {
            this.logger.warn(`Triggers version fetch failed (${err.message}) — fallback unreachable`);
            return of(null);
          }),
        ),
    );
    return { version: result?.version || 'unreachable', env: result?.env ?? null };
  }

  // Returns the frontend URL and runtime environment.
  async getWebVersion(): Promise<any> {
    const frontendUrl =
      (await this.prisma.setting.findUnique({ where: { name: 'FRONTEND_URL' } }).catch(() => null))?.value ??
      this.configService.get<string>('FRONTEND_URL') ??
      'http://localhost:5500';
    const url = typeof frontendUrl === 'string' ? frontendUrl : String(frontendUrl);
    return { url, env: this.resolveEnv() };
  }

  // Aggregates all service versions in parallel.
  async getAppVersions(): Promise<AppVersionsDto> {
    const [platform, aa, triggers] = await Promise.allSettled([
      this.getRahatVersion(),
      this.getAaVersion(),
      this.getTriggersVersion(),
    ]);
    const unreachable: ServiceVersionDto = { version: 'unreachable', env: null };
    const pick = (r: PromiseSettledResult<ServiceVersionDto>): ServiceVersionDto =>
      r.status === 'fulfilled' ? r.value : unreachable;
    return {
      platform: {
        version: platform.status === 'fulfilled' ? platform.value : 'unreachable',
        env: this.resolveEnv(),
      },
      rahatAa: pick(aa),
      triggers: pick(triggers),
      fetchedAt: new Date().toISOString(),
    };
  }



  async getChainType() {
    const setting = await this.settingsService.getByName('CHAIN_SETTINGS');
    const chain = setting?.value as { type?: string } | null;
    return { type: chain?.type ?? null };
  }
}
