import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { CreateProjectDto, UpdateProjectDto } from '@rahataid/extensions';
import { UUID } from 'crypto';
import { timeout } from 'rxjs/operators';
import { ProjectService } from './project.service';

@Controller('projects')
@ApiTags('Projects')
export class ProjectController {
  constructor(
    private readonly projectService: ProjectService,
    @Inject('RAHAT_CLIENT') private readonly rahatClient: ClientProxy
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
  findOne(@Param('uuid') uuid: UUID) {
    return this.rahatClient
      .send({ cmd: 'project_get', uuid }, {})
      .pipe(timeout(5000));
  }

  @Post(':uuid')
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

  @Get(':uuid/beneficiaries')
  listBeneficiaries(@Param('uuid') uuid: UUID) {
    return this.rahatClient
      .send({ cmd: 'rahat.projects.beneficiary.list' }, {})
      .pipe(timeout(5000));
  }

  @Post(':uuid/actions')
  projectActions(@Param('uuid') uuid: UUID) {
    return this.rahatClient
      .send({ cmd: 'project_actions', uuid }, {})
      .pipe(timeout(5000));
  }
}
