// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import {
  AddBeneficiariesToGroupDto,
  AddBenToProjectDto,
  AddGroupsPurposeDto,
  CreateBeneficiaryDto,
  CreateBeneficiaryGroupsDto,
  CreateBeneficiaryTransactionDto,
  ImportTempBenefDto,
  ListBeneficiariesByGroupDto,
  ListBeneficiaryDto,
  ListBeneficiaryGroupDto,
  ListTempBeneficiariesDto,
  ListTempGroupsDto,
  UpdateBeneficiaryDto,
  UpdateBeneficiaryGroupDto,
  ValidateWalletDto
} from '@rahataid/extensions';
import {
  APP,
  BeneficiaryJobs,
  BQUEUE,
  Enums,
  MS_TIMEOUT,
  SUBJECTS,
  TFile,
} from '@rahataid/sdk';
import {
  ACTIONS,
  CheckAbilities,
  JwtGuard,
} from '@rumsan/user';
import { Queue } from 'bull';
import { UUID } from 'crypto';
import { catchError, firstValueFrom, map, throwError, timeout } from 'rxjs';
import { CommsService } from '../comms/comms.service';
import { CheckHeaders, DbAbilitiesGuard, ExternalAppGuard } from '../decorators';
import { removeSpaces } from '../utils';
import { handleMicroserviceCall } from '../utils/handleMicroserviceCall';
import {
  normalizeBankedStatus,
  normalizeGender,
  normalizeInternetStatus,
  normalizePhoneStatus,
  trimNonAlphaNumericValue,
} from '../utils/sanitize-data';
import { WalletService } from '../wallet/wallet.service';
import { WalletInterceptor } from './interceptor/wallet.interceptor';
import { DocParser } from './parser';
import { WalletProcessingService } from './services/wallet-processing.service';

function getDateInfo(dateString) {
  try {
    // const [day, month, year] = dateString.split("/");
    const date = new Date(dateString);
    return {
      date: date.toISOString(),
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      age: new Date().getFullYear() - date.getFullYear(),
      isAdult: new Date().getFullYear() - date.getFullYear() > 18,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

@Controller('beneficiaries')
@ApiTags('Beneficiaries')
export class BeneficiaryController {
  constructor(
    @Inject('BEN_CLIENT') private readonly client: ClientProxy,
    @Inject('COMMS_CLIENT') private commsService: CommsService,
    @InjectQueue(BQUEUE.RAHAT) private readonly queue: Queue,
    private readonly walletProcessingService: WalletProcessingService,
    private readonly wallet: WalletService
  ) { }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get()
  async list(@Query() dto: ListBeneficiaryDto) {
    return this.client.send({ cmd: BeneficiaryJobs.LIST }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('temp/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async listTempBenef(
    @Param('uuid') uuid: UUID,
    @Query() query: ListTempBeneficiariesDto
  ) {
    return this.client.send(
      { cmd: BeneficiaryJobs.LIST_TEMP_BENEFICIARY },
      { uuid, query }
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('temp-groups')
  async listTempGroups(@Query() query: ListTempGroupsDto) {
    return this.client.send({ cmd: BeneficiaryJobs.LIST_TEMP_GROUPS }, query);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('pii')
  async listPiiData(@Query() dto: any) {
    return this.client.send({ cmd: BeneficiaryJobs.LIST_PII }, dto);
  }



  // @ApiBearerAuth(APP.JWT_BEARER)
  // @UseGuards(JwtGuard, DbAbilitiesGuard)
  // @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('stats')
  async getStats() {
    const commsClient = await this.commsService.getClient();
    const commsStats = await commsClient.broadcast.getReport({})
    const benefStats = await firstValueFrom(this.client.send({ cmd: BeneficiaryJobs.STATS }, {}));
    return { data: { commsStats: commsStats.data, benefStats: benefStats } };
  }

  @Get('stats/refresh')
  async refreshStats() {
    console.log("first")
    return this.client.send(
      { cmd: BeneficiaryJobs.REFRESH_STATS }, {}
    );
  }



  // @ApiBearerAuth(APP.JWT_BEARER)
  // @UseGuards(JwtGuard, DbAbilitiesGuard)
  @Get('statsSource')
  async getStatsSource() {
    return this.client.send({ cmd: BeneficiaryJobs.GET_ALL_STATS }, {});
  }

  // @ApiBearerAuth(APP.JWT_BEARER)
  // @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('table-stats')
  async getTableStats() {
    return this.client.send({ cmd: BeneficiaryJobs.GET_TABLE_STATS }, {});
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post()
  @UseInterceptors(WalletInterceptor)
  async create(@Body() dto: CreateBeneficiaryDto) {
    return this.client.send({ cmd: BeneficiaryJobs.CREATE }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.BENEFICIARY })
  @ApiParam({ name: 'uuid', required: true })
  @Post('projects/:uuid')
  async referBeneficiary(
    @Param('uuid') uuid: UUID,
    @Body() dto: AddBenToProjectDto
  ) {
    return this.client.send(
      { cmd: BeneficiaryJobs.ADD_TO_PROJECT },
      { dto, projectUid: uuid }
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @UseInterceptors(WalletInterceptor)
  @Post('bulk')
  async createBulk(@Body() dto: CreateBeneficiaryDto[]) {
    const data = dto.map((b) => ({
      ...b,
      birthDate: b.birthDate ? new Date(b.birthDate).toISOString() : null,
    }));

    return this.client
      .send({ cmd: BeneficiaryJobs.CREATE_BULK }, data)
      .pipe(timeout(MS_TIMEOUT));
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: TFile, @Req() req: Request) {
    const docType: Enums.UploadFileType =
      req.body['doctype']?.toUpperCase() || Enums.UploadFileType.JSON;
    const projectId = req.body['projectId'];
    const groupName = req.body['groupName']?.trim();

    const beneficiaries = await DocParser(docType, file.buffer);

    // Each entry lists every header alias a column may appear under; the first
    // alias with a value wins. Keeping aliases together also drives extras capture.
    const UPLOAD_COLUMN_ALIASES: Record<string, string[]> = {
      birthDate: ['Birth Date'],
      internetStatus: ['Internet Status', 'Internet Status*'],
      bankedStatus: ['Bank Status', 'Bank Status*'],
      location: ['Location'],
      phoneStatus: ['Phone Status', 'Phone Status*'],
      notes: ['Notes'],
      gender: ['Gender*', 'Gender'],
      latitude: ['Latitude'],
      longitude: ['Longitude'],
      age: ['Age', 'Age*'],
      walletAddress: ['Wallet Address'],
      name: ['Name*', 'Name'],
      phone: ['Whatsapp Number*', 'Phone Number*', 'Phone Number'],
      governmentId: ['Government ID'],
    };
    const CLAIMED_UPLOAD_COLUMNS = Object.values(UPLOAD_COLUMN_ALIASES).flat();

    const pick = (row: any, field: keyof typeof UPLOAD_COLUMN_ALIASES) => {
      const alias = UPLOAD_COLUMN_ALIASES[field].find(
        (key) => row[key] !== undefined && row[key] !== ''
      );
      return alias ? row[alias] : undefined;
    };

    const toNumberOrUndefined = (value: unknown) =>
      value !== undefined && value !== '' ? Number(value) : undefined;

    const beneficiariesMapped = beneficiaries.map((b) => {
      const remainingColumns = Object.keys(b).reduce((acc, key) => {
        if (!CLAIMED_UPLOAD_COLUMNS.includes(key)) {
          acc[key] = b[key];
        }
        return acc;
      }, {} as Record<string, unknown>);

      const birthDate = pick(b, 'birthDate');

      return {
        birthDate: birthDate ? new Date(birthDate as string).toISOString() : null,
        internetStatus: normalizeInternetStatus(pick(b, 'internetStatus') as string),
        bankedStatus: normalizeBankedStatus(pick(b, 'bankedStatus') as string),
        location: pick(b, 'location'),
        phoneStatus: normalizePhoneStatus(pick(b, 'phoneStatus') as string),
        notes: pick(b, 'notes'),
        gender: normalizeGender(pick(b, 'gender') as string),
        latitude: toNumberOrUndefined(pick(b, 'latitude')),
        longitude: toNumberOrUndefined(pick(b, 'longitude')),
        age: pick(b, 'age') || null,
        walletAddress: pick(b, 'walletAddress'),
        extras: remainingColumns,
        piiData: {
          name: pick(b, 'name') || 'Unknown',
          phone: pick(b, 'phone'),
          extras: {
            isAdult: getDateInfo(birthDate as string)?.isAdult || Number(pick(b, 'age')) > 18,
            governmentId: pick(b, 'governmentId'),
          },
        },
      };
    });

    // Process wallet addresses using the wallet processing service
    const walletProcessingResult = await this.walletProcessingService.processBeneficiariesWithWallets(beneficiariesMapped);
    const createBulkResponse = await firstValueFrom(
      this.client
        .send(
          { cmd: BeneficiaryJobs.CREATE_BULK_WITH_GROUP },
          {
            payload: walletProcessingResult.validBeneficiaries,
            projectUUID: projectId,
            groupName,
          }
        )
        .pipe(
          map((response) => {
            if (walletProcessingResult.discardedBeneficiaries.length > 0) {
              console.warn(`WARNING: ${walletProcessingResult.totalDiscarded} out of ${walletProcessingResult.totalProcessed} beneficiaries were discarded due to Xcapit wallet creation failures:`);
              walletProcessingResult.discardedBeneficiaries.forEach((discarded) => {
                console.warn(`   - Phone: ${discarded.phoneNumber}, Reason: ${discarded.status}`);
              });
              console.warn(`Successfully processed ${walletProcessingResult.validBeneficiaries.length} beneficiaries with valid wallets.`);
            }

            return {
              ...response,
              discardedBeneficiaries: walletProcessingResult.discardedBeneficiaries,
              walletProcessingSummary: {
                totalProcessed: walletProcessingResult.totalProcessed,
                totalDiscarded: walletProcessingResult.totalDiscarded,
                totalValid: walletProcessingResult.validBeneficiaries.length
              }
            };
          }),
          catchError((error) => {
            console.log('error', error);
            return throwError(() => new BadRequestException(error.message));
          }),
          timeout(MS_TIMEOUT)
        )
    );

    console.debug(createBulkResponse)

    return createBulkResponse;
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post('upload-queue')
  @UseInterceptors(FileInterceptor('file'))
  async uploadWithQueue(@UploadedFile() file: TFile, @Req() req: Request) {
    const docType: Enums.UploadFileType =
      req.body['doctype']?.toUpperCase() || Enums.UploadFileType.JSON;
    const projectId = req.body['projectId'];
    const automatedGroupOption = req.body['automatedGroupOption'];
    automatedGroupOption.createAutomatedGroup = JSON.parse(
      automatedGroupOption.createAutomatedGroup
    );
    console.log(automatedGroupOption);
    const beneficiaries = await DocParser(docType, file.buffer);


    // Utility function to sanitize input keys by trimming whitespace
    function sanitizeKey(key: string): string {
      return key.trim();
    }

    const beneficiariesWithSanitizedKeys = beneficiaries.map((b) => {
      const sanitizedBeneficiary = {};
      for (const key in b) {
        sanitizedBeneficiary[sanitizeKey(key)] = b[key];
      }
      return sanitizedBeneficiary;
    }
    );


    // Map the beneficiaries to the format expected by the microservice


    const beneficiariesMapped = beneficiariesWithSanitizedKeys.map((b) => ({
      birthDate: b[sanitizeKey('Birth Date')]
        ? new Date(b[sanitizeKey('Birth Date')]).toISOString()
        : null,
      internetStatus: b[sanitizeKey('Internet Status*')],
      bankedStatus: b[sanitizeKey('Bank Status*')],
      location: trimNonAlphaNumericValue(b[sanitizeKey('Location')]),
      phoneStatus: b[sanitizeKey('Phone Status*')],
      notes: b[sanitizeKey('Notes')],
      gender: b[sanitizeKey('Gender*')] || b[sanitizeKey('Gender')],
      latitude: b[sanitizeKey('Latitude')],
      longitude: b[sanitizeKey('Longitude')],
      age: b[sanitizeKey('Age')] || null,
      walletAddress: b[sanitizeKey('Wallet Address')],
      piiData: {
        name: b[sanitizeKey('Name*')] || b[sanitizeKey('Beneficiary Name')] || 'Unknown',
        phone: removeSpaces(
          b[sanitizeKey('Whatsapp Number*')] ||
          b[sanitizeKey('Phone Number*')] ||
          b[sanitizeKey('Phone Number')] ||
          b[sanitizeKey('Beneficiary Phone Number')] ||
          b[sanitizeKey('Phone number')]
        ),
      },
      extras: {
        healthWorker: b[sanitizeKey('Health Worker Username')] || "Unknown",
        type: b[sanitizeKey('Type')] || null,
        phone: removeSpaces(
          b[sanitizeKey('Phone Number*')] ||
          b[sanitizeKey('Beneficiary Phone Number')] ||
          b[sanitizeKey('Phone number')] || null
        ),
        visionCenter: b[sanitizeKey('Vision Center Name')] || null,
        reasonForLead: b[sanitizeKey('Reason For Lead')] || null,
        village: b[sanitizeKey('Village')] || null,
        commune: b[sanitizeKey('Commune')] || null,
        district: b[sanitizeKey('District')] || null,
        province: b[sanitizeKey('Province')] || null,
        occupation: b[sanitizeKey('Occupation')] || null,
      },
    }));


    const uniquePhoneNumberedBeneficiaries = beneficiariesMapped.filter(
      (b, index, self) =>
        index ===
        self.findIndex(
          (t) => t.piiData.phone === b.piiData.phone
        )
    );

    // uniquePhoneNumberedBeneficiaries.forEach((beneficiary) => {
    //   console.log(beneficiary, beneficiary.piiData.extras);
    // });
    // return "sda"


    console.log(`Trying to upload ${beneficiariesMapped.length} beneficiaries through queue. Unique phone numbers: ${uniquePhoneNumberedBeneficiaries.length}, Duplicate phone numbers: ${beneficiariesMapped.length - uniquePhoneNumberedBeneficiaries.length}`);

    // Process wallet addresses using the wallet processing service
    const beneficiariesWithWallets = await this.walletProcessingService.processBeneficiariesWithWallets(uniquePhoneNumberedBeneficiaries);

    return handleMicroserviceCall({
      client: this.client.send(
        { cmd: BeneficiaryJobs.IMPORT_BENEFICIARY_LARGE_QUEUE },
        {
          data: beneficiariesWithWallets,
          projectUUID: projectId,
          ignoreExisting: true,
          automatedGroupOption,
        }
      ),
      onError(error) {
        console.log('error', error);
        return throwError(() => new BadRequestException(error.message));
      },
      onSuccess(response) {
        // console.log('response', response)
        return response;
      },
    });

    // return this.client
    //   .send({ cmd: BeneficiaryJobs.IMPORT_BENEFICIARY_LARGE_QUEUE }, {
    //     data: beneficiariesMapped, projectUUID: projectId,

    //   })
    //   .pipe(
    //     catchError((error) => {
    //       console.log('error', error);
    //       return throwError(() => new BadRequestException(error.message));
    //     })
    //   )
    //   .pipe(timeout(MS_TIMEOUT)).toPromise()

    // return {
    //   success: true,
    //   message: 'Upload in progress. Will start appearing once completed.'
    // }
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.UPDATE, subject: SUBJECTS.BENEFICIARY })
  @Patch(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async update(@Param('uuid') uuid: UUID, @Body() dto: UpdateBeneficiaryDto) {
    return this.client.send({ cmd: BeneficiaryJobs.UPDATE }, { uuid, ...dto });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.UPDATE, subject: SUBJECTS.BENEFICIARY })
  @Patch('remove/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async remove(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.REMOVE }, { uuid });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.DELETE, subject: SUBJECTS.BENEFICIARY })
  @Delete(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async delete(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.DELETE }, { uuid });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('bank-account')
  @ApiQuery({ name: 'uuid', required: false })
  @ApiQuery({ name: 'walletAddress', required: false })
  async getBeneficiaryBankAccount(
    @Query('uuid') uuid?: string,
    @Query('walletAddress') walletAddress?: string
  ) {
    return this.client.send(
      { cmd: BeneficiaryJobs.GET_BENEFICIARY_BANK_ACCOUNT },
      { uuid, walletAddress }
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async getBeneficiary(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.GET }, uuid);
  }

  @Get('wallet/:wallet')
  @ApiParam({ name: 'wallet', required: true })
  async getBeneficiaryByWallet(@Param('wallet') wallet: string) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_BY_WALLET }, wallet);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('phone/:phone/:projectUUID')
  @ApiParam({ name: 'phone', required: true })
  @ApiParam({ name: 'projectUUID', required: true })
  async getBeneficiaryByPhone(
    @Param('phone') phone: string,
    @Param('projectUUID') projectUUID: string
  ) {
    return this.client.send(
      { cmd: BeneficiaryJobs.GET_BY_PHONE },
      { phone, projectUUID }
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('phone/:phone')
  @ApiParam({ name: 'phone', required: true })
  async getBeneficiaryByPhoneOnly(@Param('phone') phone: string) {
    return this.client.send(
      { cmd: BeneficiaryJobs.GET_BENEFICIARY_DETAILS_BY_PHONE },
      { phone }
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('verification-link/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async generateVerificationLink(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.GENERATE_LINK }, uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post('validate-wallet')
  async validateWallet(@Body() dto: ValidateWalletDto) {
    return this.client.send({ cmd: BeneficiaryJobs.VALIDATE_WALLET }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post('verify-signature')
  async verifySignature(@Body() dto: any) {
    return this.client.send({ cmd: BeneficiaryJobs.VERIFY_SIGNATURE }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.BENEFICIARY })
  @Post('groups/:uuid/sync')
  @ApiParam({ name: 'uuid', required: true })
  async syncGroupToProjects(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.SYNC_GROUP_TO_PROJECTS }, { groupUuid: uuid });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post('groups')
  async createGroup(@Body() dto: CreateBeneficiaryGroupsDto) {
    return this.client.send({ cmd: BeneficiaryJobs.ADD_GROUP }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.UPDATE, subject: SUBJECTS.BENEFICIARY })
  @Post('groups/add-beneficiaries')
  async addBeneficiariesToGroup(@Body() dto: AddBeneficiariesToGroupDto) {
    return this.client.send({ cmd: BeneficiaryJobs.ADD_BENEFICIARIES_TO_GROUP }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('groups/all')
  async getAllGroups(@Query() dto: ListBeneficiaryGroupDto) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_ALL_GROUPS }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('groups/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async getOneGroup(
    @Param('uuid') uuid: UUID,
    @Query() dto: ListBeneficiariesByGroupDto
  ) {
    return this.client.send(
      { cmd: BeneficiaryJobs.GET_ONE_GROUP },
      { uuid, ...dto }
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('groups/:uuid/account-check')
  @ApiParam({ name: 'uuid', required: true })
  async groupAccountCheck(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.GROUP_ACCOUNT_CHECK }, uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('groups/:uuid/bank-check-status')
  @ApiParam({ name: 'uuid', required: true })
  async getGroupBankCheckStatus(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_GROUP_BANK_CHECK_STATUS }, uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Get('groups/:uuid/fail-account/export')
  @ApiParam({ name: 'uuid', required: true })
  async getGroupBeneficiariesFailedAccount(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_GROUP_BENEF_FAIL_ACCOUNT }, uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.DELETE, subject: SUBJECTS.BENEFICIARY })
  @Delete('groups/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  @ApiQuery({ name: 'hardDelete', required: false, type: Boolean, description: 'If true, permanently deletes the group and beneficiaries. If false or not provided, performs soft delete.' })
  async removeGroup(
    @Param('uuid') uuid: UUID,
    @Query('hardDelete') hardDelete?: boolean
  ) {
    const deleteType = hardDelete === true;
    const command = deleteType ? BeneficiaryJobs.DELETE_ONE_GROUP : BeneficiaryJobs.REMOVE_ONE_GROUP;
    return this.client.send({ cmd: command }, uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.UPDATE, subject: SUBJECTS.BENEFICIARY })
  @Patch('groups/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async updateGroup(
    @Param('uuid') uuid: UUID,
    @Body() dto: UpdateBeneficiaryGroupDto
  ) {
    return this.client.send(
      { cmd: BeneficiaryJobs.UPDATE_GROUP },
      { uuid, ...dto }
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.UPDATE, subject: SUBJECTS.BENEFICIARY })
  @Patch('groups/:uuid/addGroupPurpose')
  @ApiParam({ name: 'uuid', required: true })
  async addGroupPurpose(@Param('uuid') uuid: UUID, @Body() dto: AddGroupsPurposeDto) {
    return this.client.send({ cmd: BeneficiaryJobs.ADD_GROUP_PURPOSE }, { uuid, ...dto });
  }

  @Post('import-tools')
  @UseGuards(ExternalAppGuard)
  @CheckHeaders('Signature')
  async importBeneficiariesFromTool(@Req() req: Request) {
    console.log('Received request to import beneficiaries from external tool');
    return this.client.send(
      {
        cmd: BeneficiaryJobs.IMPORT_BENEFICIARIES_FROM_COMMUNITY_TOOL,
      },
      req.body
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post('import-temp')
  async importTempBeneficiaries(@Body() dto: ImportTempBenefDto) {
    return this.client.send(
      { cmd: BeneficiaryJobs.IMPORT_TEMP_BENEFICIARIES },
      dto
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.BENEFICIARY })
  @Post('groupDetails')
  async getReferredBeneficiary(@Body() uuids: UUID[]) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_GROUP_DETAILS_BY_UUIDS }, uuids);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, DbAbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.BENEFICIARY })
  @Post('beneficiaryWithDbTransaction')
  async createBeneficiaryWithDbTransaction(@Body() body: CreateBeneficiaryTransactionDto) {
    return await this.client.send({ cmd: BeneficiaryJobs.CREATE_BENEFICIARY_WITH_DB_TRANSACTION }, body);
  }
}
