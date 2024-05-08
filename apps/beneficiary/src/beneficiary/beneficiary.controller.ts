import { Controller, Inject, Param } from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload } from '@nestjs/microservices';
import {
  CreateBeneficiaryDto,
  ListBeneficiaryDto,
  UpdateBeneficiaryDto
} from '@rahataid/extensions';
import {
  BeneficiaryJobs,
  ProjectContants,
  ValidateWallet,
} from '@rahataid/sdk';
import { UUID } from 'crypto';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryStatService } from './beneficiaryStat.service';
import { VerificationService } from './verification.service';

@Controller()
export class BeneficiaryController {
  constructor(
    private readonly beneficiaryService: BeneficiaryService,
    private readonly beneficiaryStatsService: BeneficiaryStatService,
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy,
    private readonly service: BeneficiaryService,
    private readonly statsService: BeneficiaryStatService,
    private readonly verificationService: VerificationService
  ) { }

  @MessagePattern({ cmd: BeneficiaryJobs.CREATE })
  async create(@Payload() createBeneficiaryDto: CreateBeneficiaryDto) {
    return this.service.create(createBeneficiaryDto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.GET })
  async getBeneficiary(uuid: UUID) {
    return this.service.findOne(uuid);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.GET_BY_WALLET })
  async getBeneficiaryByWallet(wallet: string) {
    return this.service.findOneByWallet(wallet);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.GET_BY_PHONE })
  async getBeneficiaryByPhone(wallet: string) {
    return this.service.findOneByPhone(wallet);
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
  async listByProject(data: any) {
    return this.service.listBenefByProject(data);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.LIST_PII })
  async listPiiData(dto: any) {
    return this.service.listPiiData(dto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.STATS })
  async stats() {
    return this.statsService.getAllStats();
  }

  @MessagePattern({ cmd: BeneficiaryJobs.PROJECT_STATS })
  async projectStats(uuid: string) {
    return this.statsService.getAllStats(uuid);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.ADD_TO_PROJECT })
  async addToProject(payload: any) {
    const { dto, projectUid } = payload;
    return this.beneficiaryService.addBeneficiaryToProject(dto, projectUid);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.ASSIGN_TO_PROJECT })
  async assignToProject(payload: any) {
    return this.beneficiaryService.assignBeneficiaryToProject(payload);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.BULK_ASSIGN_TO_PROJECT })
  async bulkAssignToProject(payload: any) {
    return this.beneficiaryService.bulkAssignToProject(payload);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.UPDATE })
  update(@Param('uuid') uuid: UUID, @Payload() dto: UpdateBeneficiaryDto) {
    const benefUUID = uuid ? uuid : dto.uuid;
    return this.service.update(benefUUID, dto);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.DELETE })
  delete(payload: any) {
    return this.service.delete(payload.uuid);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.REMOVE })
  async remove(payload: any) {
    return this.service.remove(payload);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.GENERATE_LINK })
  generateLink(uuid: UUID) {
    return this.verificationService.generateLink(uuid);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.VALIDATE_WALLET })
  validateWallet(validationData: ValidateWallet) {
    return this.verificationService.validateWallet(validationData);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.VERIFY_SIGNATURE })
  verifySignature(verificationData: any) {
    return this.verificationService.verifySignature(verificationData);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.LIST_REFERRAL })
  listVendorReferral(data) {
    return this.beneficiaryService.listReferredBen(data);
  }

  @MessagePattern({ cmd: BeneficiaryJobs.LIST_BEN_VENDOR_COUNT })
  getTotalCount(data) {
    return this.beneficiaryService.getTotalCount(data)
  }

  @MessagePattern({ cmd: BeneficiaryJobs.GET_PROJECT_SPECIFIC })
  getProjectSpecific(data) {
    return this.beneficiaryService.getProjectSpecificData(data)
  }

  @MessagePattern({ cmd: BeneficiaryJobs.GET_TABLE_STATS })
  getTableStats() {
    return this.beneficiaryStatsService.getTableStats()
  }
}