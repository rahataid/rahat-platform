import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateProjectDto, UpdateProjectDto } from './dto/create-project.dto';
import { ProjectService } from './project.service';
import { UUID } from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { timeout } from 'rxjs/operators';

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
}
