import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
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
