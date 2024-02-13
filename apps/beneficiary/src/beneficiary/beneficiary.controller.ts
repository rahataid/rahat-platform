import { Controller, Param } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { BeneficiaryService } from './beneficiary.service';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { JOBS } from '@rahat/sdk';
import { UUID } from 'crypto';

@Controller()
export class BeneficiaryController {
  constructor(private readonly beneficiaryService: BeneficiaryService) {}

  @MessagePattern({ cmd: JOBS.BENEFICIARY.CREATE })
  create(@Payload() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.beneficiaryService.create(createBeneficiaryDto);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.LIST })
  async list(dto: ListBeneficiaryDto) {
    return this.beneficiaryService.list(dto);
  }

  // @MessagePattern({ cmd: JOBS.BENEFICIARY.GET })
  // get(@Param('uuid') uuid: UUID) {
  //   return this.beneficiaryService.get(uuid);
  // }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.UPDATE })
  update(
    @Param('uuid') uuid: UUID,
    @Payload() updateBeneficiaryDto: UpdateBeneficiaryDto
  ) {
    return this.beneficiaryService.update(uuid, updateBeneficiaryDto);
  }

  // @MessagePattern({ cmd: JOBS.BENEFICIARY.REMOVE })
  // remove(@Param('uuid') uuid: UUID) {
  //   return this.beneficiaryService.remove(uuid);
  // }
}
