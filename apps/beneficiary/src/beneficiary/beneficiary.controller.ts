import { Controller, Inject, Param } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { BeneficiaryService } from './beneficiary.service';
import {
  AddToProjectDto,
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  TFile,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { JOBS } from '@rahat/sdk';
import { UUID } from 'crypto';

@Controller()
export class BeneficiaryController {
  constructor(
    private readonly beneficiaryService: BeneficiaryService,
    @Inject('EL_PROJECT_CLIENT') private readonly client: ClientProxy
  ) {}

  @MessagePattern({ cmd: JOBS.BENEFICIARY.CREATE })
  create(@Payload() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.beneficiaryService.create(createBeneficiaryDto);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.CREATE_BULK })
  uploadBulk(@Payload() data) {
    return this.beneficiaryService.createBulk(data);
  }

  @MessagePattern({ cmd: JOBS.BENEFICIARY.LIST })
  async list(dto: ListBeneficiaryDto) {
    return this.beneficiaryService.list(dto);
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
