import { Controller, Inject, Param } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import { BeneficiaryService } from './beneficiary.service';
import {
  CreateBeneficiaryDto,
  Enums,
  ListBeneficiaryDto,
  TFile,
  UpdateBeneficiaryDto,
} from '@rahat/sdk';
import { JOBS } from '@rahat/sdk';
import { UUID } from 'crypto';
import { BeneficiaryType } from 'libs/sdk/src/enums';

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
    dto.type = BeneficiaryType.REFERRED;
    dto.walletAddress = Buffer.from(dto.walletAddress.slice(2), 'hex');
    const { referral, ...rest } = dto;
    const row = await this.beneficiaryService.create(rest);
    const elPayload = {
      ...referral,
      uuid: row.uuid,
      walletAddress: dto.walletAddress.toString('hex'),
      extras: dto.extras || null,
    };
    return this.client.send({ cmd: 'ben-referred' }, elPayload);
    // Send whatsapp message to the referred beneficiary
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
