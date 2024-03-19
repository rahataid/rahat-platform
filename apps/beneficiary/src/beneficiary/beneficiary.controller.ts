import { Controller, Inject, Param } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  ListProjectBeneficiaryDto,
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

  @MessagePattern({ cmd: BeneficiaryJobs.LIST_BY_PROJECT })
  async listByProject(dto: ListProjectBeneficiaryDto) {
    return this.service.listBenefByProject(dto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.LIST_PII })
  async listPiiData(dto: any) {
    return this.service.listPiiData(dto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.STATS })
  async stats() {
    return this.statsService.getAllStats();
  }

  @MessagePattern({ cmd: BeneficiaryJobs.ADD_TO_PROJECT })
  async addToProject(payload: any) {
    const { dto, projectUid } = payload;
    return this.beneficiaryService.addBeneficiaryToProject(dto, projectUid);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.UPDATE })
  update(@Param('uuid') uuid: UUID, @Payload() dto: UpdateBeneficiaryDto) {
    const benefUUID = uuid ? uuid : dto.uuid;
    return this.service.update(benefUUID, dto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.REMOVE })
  remove(@Param('uuid') uuid: UUID) {
    return this.service.remove(uuid);
  }
}
