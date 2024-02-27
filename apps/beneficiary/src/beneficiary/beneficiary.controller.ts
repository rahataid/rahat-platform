import { Controller, Inject, Param } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import {
  AddToProjectDto,
  CreateBeneficiaryDto,
  JOBS,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { UUID } from 'crypto';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryStatService } from './beneficiaryStat.service';

@Controller()
export class BeneficiaryController {
  constructor(
    private readonly beneficiaryService: BeneficiaryService,
    @Inject('EL_PROJECT_CLIENT') private readonly client: ClientProxy,
    private readonly service: BeneficiaryService,
    private readonly statsService: BeneficiaryStatService
  ) {}

  @MessagePattern({ cmd: JOBS.BENEFICIARY.CREATE })
  async create(@Payload() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.service.create(createBeneficiaryDto);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.CREATE_BULK })
  createBulk(@Payload() data) {
    return this.service.createBulk(data);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.LIST })
  async list(dto: ListBeneficiaryDto) {
    return this.service.list(dto);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.STATS })
  async stats() {
    return this.statsService.getAllStats();
  }

  // TODO: Update cmd constant
  @MessagePattern({ cmd: JOBS.BENEFICIARY.REFER })
  async referBeneficiary(dto: CreateBeneficiaryDto) {
    return this.beneficiaryService.referBeneficiary(dto);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.ADD_TO_PROJECT })
  async addToProject(dto: AddToProjectDto) {
    return this.beneficiaryService.addToProject(dto);
  }
  // @MessagePattern({ cmd: JOBS.BENEFICIARY.GET })
  // get(@Param('uuid') uuid: UUID) {
  //   return this.service.get(uuid);
  // }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.UPDATE })
  update(
    @Param('uuid') uuid: UUID,
    @Payload() updateBeneficiaryDto: UpdateBeneficiaryDto
  ) {
    return this.service.update(uuid, updateBeneficiaryDto);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.REMOVE })
  remove(@Param('uuid') uuid: UUID) {
    return this.service.remove(uuid);
  }
}
