// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
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
import { ClientProxy } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreateProjectDto,
  ListProjectBeneficiaryDto,
  ProjectCommunicationDto,
  TestKoboImportDto,
  UpdateProjectDto,
  UpdateProjectStatusDto,
} from '@rahataid/extensions';
import {
  ACTIONS,
  APP,
  BeneficiaryJobs,
  Enums,
  MS_TIMEOUT,
  ProjectJobs,
  TFile,
} from '@rahataid/sdk';
import { CreateSettingDto } from '@rumsan/extensions/dtos';
import {
  AbilitiesGuard,
  CheckAbilities,
  JwtGuard,
  SUBJECTS,
} from '@rumsan/user';
import { UUID } from 'crypto';
import { Request } from 'express';
import { throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { DocParser } from '../utils/doc-parser';
import { ProjectService } from './project.service';

@Controller('projects')
@ApiTags('Projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    @Inject('RAHAT_CLIENT') private readonly rahatClient: ClientProxy,
    @Inject('BEN_CLIENT') private readonly benClient: ClientProxy
  ) { }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.ALL })
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.USER })
  @Get()
  list() {
    return this.projectService.list();
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.USER })
  @Post('actions')
  msActions(
    @Body() data: ProjectCommunicationDto,
    @Req() request: Request
  ) {
    const response = this.projectService.handleMsActions({
      ...data,
      user: request.user,
    });
    return response;
  }

  // @ApiBearerAuth(APP.JWT_BEARER)
  // @UseGuards(JwtGuard, AbilitiesGuard)
  // @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: TFile, @Req() req: Request) {
    const docType: Enums.UploadFileType =
      req.body['doctype']?.toUpperCase() || Enums.UploadFileType.EXCEL;
    const projectId = req.body['projectId'];

    const rawData = await DocParser(docType, file.buffer);
    const data = rawData.map((item) => ({
      name: item['Name']?.trim() || item['Stakeholders Name']?.trim() || '',
      designation: item['Designation']?.trim() || '',
      organization: item['Organization']?.trim() || '',
      district: item['District']?.trim() || '',
      municipality: item['Municipality']?.trim() || '',
      phone: item['Mobile #']?.toString().trim() || item['Phone Number']?.toString().trim() || '',
      email: item['Email ID']?.trim() || item['Email']?.trim() || ''
    }));

    const response = await this.projectService.handleProjectActions({
      action: req.body['action'],
      uuid: projectId,
      payload: data,
      user: null,
      trigger: null,
    });
    return response
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
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.USER })
  @Get(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  findOne(@Param('uuid') uuid: UUID) {
    return this.projectService.findOne(uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.ALL })
  @ApiParam({ name: 'uuid', required: true })
  @Patch(':uuid')
  update(
    @Body() updateProjectDto: UpdateProjectDto,
    @Param('uuid') uuid: UUID
  ) {
    return this.projectService.update(uuid, updateProjectDto);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.ALL })
  @ApiParam({ name: 'uuid', required: true })
  @Patch(':uuid/status')
  updateStatus(
    @Body() data: UpdateProjectStatusDto,
    @Param('uuid') uuid: UUID
  ) {
    return this.projectService.updateStatus(uuid, data);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.ALL })
  @Delete(':uuid')
  remove(@Param('uuid') uuid: UUID) {
    return this.projectService.remove(uuid);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @ApiParam({ name: 'uuid', required: true })
  @Get(':uuid/beneficiaries')
  listBeneficiaries(@Query() dto: ListProjectBeneficiaryDto) {
    return this.rahatClient
      .send({ cmd: BeneficiaryJobs.LIST }, dto)
      .pipe(timeout(5000));
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.ALL })
  @ApiParam({ name: 'uuid', required: true })
  @Post(':uuid/settings')
  addSettings(@Param('uuid') uuid: UUID, @Body() dto: CreateSettingDto) {
    return this.rahatClient
      .send({ cmd: ProjectJobs.PROJECT_SETTINGS, uuid }, dto)
      .pipe(timeout(5000));
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.CREATE, subject: SUBJECTS.USER })
  @ApiParam({ name: 'uuid', required: true })
  @Post(':uuid/actions')
  projectActions(
    @Param('uuid') uuid: UUID,
    @Body() data: ProjectCommunicationDto,
    @Req() request: Request
  ) {
    const response = this.projectService.handleProjectActions({
      uuid,
      ...data,
      user: request.user,
    });
    return response;
  }

  //list project specific stats
  // @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  // @ApiParam({ name: 'uuid', required: true })
  @Get(':uuid/stats')
  projectStats(@Param('uuid') uuid: UUID) {
    return this.benClient
      .send({ cmd: BeneficiaryJobs.PROJECT_STATS }, uuid)
      .pipe(timeout(MS_TIMEOUT));
  }

  //Get datasource for entire project
  // @Get('statsSources')
  // statsSource() {
  //   return this.benClient
  //     .send({ cmd: BeneficiaryJobs.GET_ALL_STATS }, {})
  //     .pipe(timeout(MS_TIMEOUT));
  // }

  //Get datasource for entire project
  // @Get('statsSources')
  // statsSource() {

  //list project specific stats sources
  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @ApiParam({ name: 'uuid', required: false })
  @Get(':uuid/statsSources')
  projectStatsSources(@Param('uuid') uuid: UUID) {
    return this.benClient
      .send({ cmd: BeneficiaryJobs.GET_STATS }, { uuid })
      .pipe(timeout(MS_TIMEOUT));
  }

  @Post('/:uuid/kobo-import')
  @ApiParam({ name: 'uuid', required: true })
  importFromKobo(@Param('uuid') uuid: UUID, @Body() data: any) {
    return this.projectService.importKoboBeneficiary(uuid, data);
  }

  @Post('/:uuid/test')
  @ApiParam({ name: 'uuid', required: true })
  testMsg(@Param('uuid') uuid: UUID) {
    return this.projectService.sendTestMsg(uuid);
  }

  @Post('/:uuid/kobo-import-simulate')
  @ApiParam({ name: 'uuid', required: true })
  koboImportSimulate(@Param('uuid') uuid: UUID, @Body() dto: TestKoboImportDto) {
    return this.projectService.importTestBeneficiary(uuid, dto);
  }
}
