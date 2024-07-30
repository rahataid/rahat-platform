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
  UseInterceptors
} from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  AddBenToProjectDto,
  CreateBeneficiaryDto,
  CreateBeneficiaryGroupsDto,
  ImportTempBenefDto,
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
  TFile
} from '@rahataid/sdk';
import { AbilitiesGuard, ACTIONS, CheckAbilities, JwtGuard, SUBJECTS } from '@rumsan/user';
import { Queue } from 'bull';
import { UUID } from 'crypto';
import { catchError, throwError, timeout } from 'rxjs';
import { DocParser } from './parser';

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
    @InjectQueue(BQUEUE.RAHAT) private readonly queue: Queue
  ) { }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get()
  async list(@Query() dto: ListBeneficiaryDto) {
    return this.client.send({ cmd: BeneficiaryJobs.LIST }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('temp/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async listTempBenef(@Param('uuid') uuid: UUID, @Query() query: ListTempBeneficiariesDto) {

    return this.client.send({ cmd: BeneficiaryJobs.LIST_TEMP_BENEFICIARY }, { uuid, query });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('temp-groups')
  async listTempGroups(@Query() query: ListTempGroupsDto) {
    return this.client.send({ cmd: BeneficiaryJobs.LIST_TEMP_GROUPS }, query);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('pii')
  async listPiiData(@Query() dto: any) {
    return this.client.send({ cmd: BeneficiaryJobs.LIST_PII }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('stats')
  async getStats() {
    return this.client.send({ cmd: BeneficiaryJobs.STATS }, {});
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @Get('statsSource')
  async getStatsSource() {
    return this.client.send({ cmd: BeneficiaryJobs.GET_ALL_STATS }, {});
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('table-stats')
  async getTableStats() {
    return this.client.send({ cmd: BeneficiaryJobs.GET_TABLE_STATS }, {});
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post()
  async create(@Body() dto: CreateBeneficiaryDto) {
    return this.client.send({ cmd: BeneficiaryJobs.CREATE }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.USER })
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
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('bulk')
  async createBulk(@Body() dto: CreateBeneficiaryDto[]) {
    const data = dto.map((b) => ({
      ...b,
      birthDate: b.birthDate ? new Date(b.birthDate).toISOString() : null,
    }));
    return this.client
      .send({ cmd: BeneficiaryJobs.CREATE_BULK }, data)
      .pipe(
        catchError((error) =>
          throwError(() => new RpcException(error.response))
        )
      )
      .pipe(timeout(MS_TIMEOUT));
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: TFile, @Req() req: Request) {
    const docType: Enums.UploadFileType =
      req.body['doctype']?.toUpperCase() || Enums.UploadFileType.JSON;
    const beneficiaries = await DocParser(docType, file.buffer);

    const beneficiariesMapped = beneficiaries.map((b) => ({
      birthDate: new Date(b['Birth Date']).toISOString() || null,
      internetStatus: b['Internet Status*'],
      bankedStatus: b['Bank Status*'],
      location: b['Location'],
      phoneStatus: b['Phone Status*'],
      notes: b['Notes'],
      gender: b['Gender*'],
      latitude: b['Latitude'],
      longitude: b['Longitude'],
      age: b['Age'] || null,
      walletAddress: b['Wallet Address'],
      piiData: {
        name: b['Name*'],
        phone: b['Whatsapp Number*'],
        extras: {
          isAdult:
            getDateInfo(b['Birth Date'])?.isAdult || Number(b['Age*']) > 18,
          governmentId: b['Government ID'],
        },
      },
    }));

    return this.client
      .send({ cmd: BeneficiaryJobs.CREATE_BULK }, beneficiariesMapped)
      .pipe(
        catchError((error) => {
          console.log('error', error);
          return throwError(() => new BadRequestException(error.message));
        })
      )
      .pipe(timeout(MS_TIMEOUT));
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Patch(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async update(@Param('uuid') uuid: UUID, @Body() dto: UpdateBeneficiaryDto) {
    return this.client.send({ cmd: BeneficiaryJobs.UPDATE }, { uuid, ...dto });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Patch('remove/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async remove(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.REMOVE }, { uuid });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Delete(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  async delete(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.DELETE }, { uuid });
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
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
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('phone/:phone')
  @ApiParam({ name: 'phone', required: true })
  async getBeneficiaryByPhone(@Param('phone') phone: string) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_BY_PHONE }, phone);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('verification-link/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async generateVerificationLink(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.GENERATE_LINK }, uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('validate-wallet')
  async validateWallet(@Body() dto: ValidateWalletDto) {
    return this.client.send({ cmd: BeneficiaryJobs.VALIDATE_WALLET }, dto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('verify-signature')
  async verifySignature(@Body() dto: any) {
    return this.client.send({ cmd: BeneficiaryJobs.VERIFY_SIGNATURE }, dto);
  }


  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('groups')
  async createGroup(@Body() dto: CreateBeneficiaryGroupsDto) {
    return this.client.send({ cmd: BeneficiaryJobs.ADD_GROUP }, dto);
  }


  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('groups/all')
  async getAllGroups(@Query() dto: ListBeneficiaryGroupDto) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_ALL_GROUPS }, dto);
  }


  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Get('groups/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async getOneGroup(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.GET_ONE_GROUP }, uuid);
  }


  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Delete('groups/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async removeGroup(@Param('uuid') uuid: UUID) {
    return this.client.send({ cmd: BeneficiaryJobs.REMOVE_ONE_GROUP }, uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Patch('groups/:uuid')
  @ApiParam({ name: 'uuid', required: true })
  async updateGroup(@Param('uuid') uuid: UUID, @Body() dto: UpdateBeneficiaryGroupDto) {
    return this.client.send({ cmd: BeneficiaryJobs.UPDATE_GROUP }, { uuid, ...dto });
  }

  @Post('import-tools')
  async importBeneficiariesFromTool(@Req() req: Request) {
    return this.client.send(
      {
        cmd: BeneficiaryJobs.IMPORT_BENEFICIARIES_FROM_COMMUNITY_TOOL,
      },
      req.body
    );
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('import-temp')
  async importTempBeneficiaries(@Body() dto: ImportTempBenefDto) {
    return this.client.send({ cmd: BeneficiaryJobs.IMPORT_TEMP_BENEFICIARIES }, dto);
  }
}
