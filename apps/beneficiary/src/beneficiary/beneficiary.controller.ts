import { Controller, Inject, Param } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddToProjectDto,
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  ReferBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahataid/extensions';
import { BeneficiaryJobs, ProjectContants } from '@rahataid/sdk';
import { UUID } from 'crypto';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryStatService } from './beneficiaryStat.service';

@Controller()
export class BeneficiaryController {
  constructor(
    private readonly beneficiaryService: BeneficiaryService,
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy,
    private readonly service: BeneficiaryService,
    private readonly statsService: BeneficiaryStatService
  ) {}

  @MessagePattern({ cmd: BeneficiaryJobs.CREATE })
  async create(@Payload() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.service.create(createBeneficiaryDto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.GET })
  async getBeneficiary(uuid: UUID) {
    return this.service.findOne(uuid);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.CREATE_BULK })
  createBulk(@Payload() data) {
    return this.service.createBulk(data);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.LIST })
  async list(dto: ListBeneficiaryDto) {
    return this.service.list(dto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.STATS })
  async stats() {
    return this.statsService.getAllStats();
  }

  // TODO: Update cmd constant
  @MessagePattern({ cmd: BeneficiaryJobs.REFER })
  async referBeneficiary(dto: ReferBeneficiaryDto) {
    return this.beneficiaryService.referBeneficiary(dto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.ADD_TO_PROJECT })
  async addToProject(dto: AddToProjectDto) {
    return this.beneficiaryService.addToProject(dto);
  }
  // @MessagePattern({ cmd: BeneficiaryJobs.GET })
  // get(@Param('uuid') uuid: UUID) {
  //   return this.service.get(uuid);
  // }

  @MessagePattern({ cmd: BeneficiaryJobs.UPDATE })
  update(
    @Param('uuid') uuid: UUID,
    @Payload() updateBeneficiaryDto: UpdateBeneficiaryDto
  ) {
    return this.service.update(uuid, updateBeneficiaryDto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.REMOVE })
  remove(@Param('uuid') uuid: UUID) {
    return this.service.remove(uuid);
  }
}
