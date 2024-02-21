import { HttpException, Inject, Injectable } from '@nestjs/common';
import { PaginatorTypes, paginator } from '@nodeteam/nestjs-prisma-pagination';
import { CreateBeneficiaryDto, ListBeneficiaryDto } from '@rahat/sdk';
import { PrismaService } from '@rumsan/prisma';
import { Beneficiary } from '@prisma/client';
import { UUID } from 'crypto';
import { BeneficiaryType } from 'libs/sdk/src/enums';
import { ClientProxy } from '@nestjs/microservices';

const REFERRAL_LIMIT = 3;

const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class BeneficiaryService {
  private rsprisma;
  constructor(
    protected prisma: PrismaService,
    @Inject('EL_PROJECT_CLIENT') private readonly client: ClientProxy
  ) {
    this.rsprisma = this.prisma.rsclient;
  }

  async list(
    dto: ListBeneficiaryDto
  ): Promise<PaginatorTypes.PaginatedResult<Beneficiary>> {
    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[dto.sort] = dto.order;
    return paginate(
      this.prisma.beneficiary,
      {
        where: {
          //deletedAt: null,
        },
        orderBy,
      },
      {
        page: dto.page,
        perPage: dto.perPage,
      }
    );
  }

  async create(data: CreateBeneficiaryDto) {
    return this.rsprisma.beneficiary.create({
      data,
    });
  }

  getByPhone(phone: string) {
    return this.rsprisma.beneficiary.findUnique({
      where: { phoneNumber: phone },
    });
  }

  async getReferralCount(referrerBenef: string) {
    const ben = await this.findOne(referrerBenef);
    if (!ben) return 0;
    return ben.beneficiariesReferred;
  }

  async findOne(uuid: string) {
    return await this.rsprisma.beneficiary.findUnique({ where: { uuid } });
  }

  async referBeneficiary(dto: CreateBeneficiaryDto) {
    const exist = await this.getByPhone(dto.phoneNumber);
    if (exist) throw new Error('Beneficiary already referred!');
    dto.type = BeneficiaryType.REFERRED;
    dto.walletAddress = Buffer.from(dto.walletAddress.slice(2), 'hex');
    // Check benefReferredCount by referrerBeneficiaryId: Must be less than 3
    const count = await this.getReferralCount(dto.referrerBeneficiary);
    if (count >= REFERRAL_LIMIT) throw new Error('Referral limit exceeded');
    // Create benefeciary
    const row = await this.create(dto);
    const updated = await this.incrementReferralCount(dto.referrerBeneficiary);
    // Send back to projects MS
    const elPayload = {
      beneficiariesReferred: updated?.beneficiariesReferred || 0,
      uuid: row.uuid,
      referrerVendor: dto.referrerVendor || '',
      referrerBeneficiary: dto.referrerBeneficiary || '',
      walletAddress: dto.walletAddress.toString('hex'),
      extras: dto.extras || null,
    };
    return this.client.send({ cmd: 'ben-referred' }, elPayload);
    // Send whatsapp message to the referred beneficiary
  }

  async incrementReferralCount(referrerUID: string) {
    const exist = await this.findOne(referrerUID);
    if (!exist) return null;
    return this.rsprisma.beneficiary.update({
      where: { uuid: referrerUID },
      data: { beneficiariesReferred: { increment: 1 } },
    });
  }

  async createBulk(data: CreateBeneficiaryDto[]) {
    return this.rsprisma.beneficiary.createMany({
      data,
    });
  }

  async update(uuid: UUID, dto: any) {
    const findUuid = await this.prisma.beneficiary.findUnique({
      where: {
        uuid,
      },
    });

    if (!findUuid) throw new Error('Data not Found');

    return await this.prisma.beneficiary.update({
      where: {
        uuid,
      },
      data: dto,
    });
  }
}
