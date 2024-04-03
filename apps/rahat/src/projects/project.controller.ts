import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiParam, ApiTags } from '@nestjs/swagger';
import {
  CreateProjectDto,
  ListProjectBeneficiaryDto,
  ProjectCommunicationDto,
  UpdateProjectDto,
} from '@rahataid/extensions';
import { BeneficiaryJobs, ProjectJobs } from '@rahataid/sdk';
import { CreateSettingDto } from '@rumsan/extensions/dtos';
import { UUID } from 'crypto';
import { timeout } from 'rxjs/operators';
import { ProjectService } from './project.service';

@Controller('projects')
@ApiTags('Projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    @Inject('RAHAT_CLIENT') private readonly rahatClient: ClientProxy,
    @Inject('BEN_CLIENT') private readonly benClient: ClientProxy
  ) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  list() {
    return this.projectService.list();
  }

  @Get(':uuid')
  @ApiParam({ name: 'uuid', required: true })
  findOne(@Param('uuid') uuid: UUID) {
    return this.projectService.findOne(uuid);
  }

  @ApiParam({ name: 'uuid', required: true })
  @Patch(':uuid')
  update(
    @Body() updateProjectDto: UpdateProjectDto,
    @Param('uuid') uuid: UUID
  ) {
    return this.projectService.update(uuid, updateProjectDto);
  }

  @Delete(':uuid')
  remove(@Param('uuid') uuid: UUID) {
    return this.projectService.remove(uuid);
  }

  @ApiParam({ name: 'uuid', required: true })
  @Get(':uuid/beneficiaries')
  listBeneficiaries(@Query() dto: ListProjectBeneficiaryDto) {
    return this.rahatClient
      .send({ cmd: BeneficiaryJobs.LIST_BY_PROJECT }, dto)
      .pipe(timeout(5000));
  }

  @ApiParam({ name: 'uuid', required: true })
  @Post(':uuid/settings')
  addSettings(@Param('uuid') uuid: UUID, @Body() dto: CreateSettingDto) {
    return this.rahatClient
      .send({ cmd: ProjectJobs.PROJECT_SETTINGS, uuid }, dto)
      .pipe(timeout(5000));
  }

  @ApiParam({ name: 'uuid', required: true })
  @Post(':uuid/actions')
  projectActions(
    @Param('uuid') uuid: UUID,
    @Body() data: ProjectCommunicationDto
  ) {
    const response = this.projectService.handleProjectActions({
      uuid,
      ...data,
    });
    return response;
  }
  //list project specific stats
  @ApiParam({ name: 'uuid', required: true })
  @Get(':uuid/stats')
  projectStats(@Param('uuid') uuid: UUID) {
    return this.benClient
      .send({ cmd: BeneficiaryJobs.PROJECT_STATS }, uuid)
      .pipe(timeout(5000));
  }
}
