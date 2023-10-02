import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';
import { ListProjectDto } from './dto/list-project-dto';
import {
  UpdateProjectCampaignDto,
  UpdateProjectDto,
} from './dto/update-project.dto';
import { ProjectService } from './project.service';

@Controller('projects')
@ApiTags('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }

  @Get()
  findAll(@Query() query: ListProjectDto) {
    return this.projectService.findAll(query);
  }

  @Get(':address')
  findOne(@Param('address') address: string) {
    return this.projectService.findOne(address);
  }

  @Patch(':address/campaigns')
  updateCampaign(
    @Param('address') address: string,
    @Body() campaigns: UpdateProjectCampaignDto,
  ) {
    return this.projectService.updateCampaign(address, campaigns);
  }

  @Patch('/remove/:address/campaigns')
  removeCampaignFromProject(
    @Param('address') address: string,
    @Body() campaigns: number[],
  ) {
    return this.projectService.removeCampaignFromProject(address, campaigns);
  }

  @Patch(':address')
  update(
    @Param('address') address: string,
    @Body() updateProjectDto: UpdateProjectDto,
  ) {
    return this.projectService.update(address, updateProjectDto);
  }

  @Get(':address/beneficiaries')
  getBeneficiaries(@Param('address') address: string) {
    return this.projectService.getBeneficiaries(address);
  }

  @Patch('/remove/:address/beneficiaries')
  removeBeneficiariesFromProject(
    @Param('address') address: string,
    @Body() beneficiaries: string[],
  ) {
    return this.projectService.removeBeneficiariesFromProject(
      address,
      beneficiaries,
    );
  }
}
