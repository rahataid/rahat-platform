import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOfframpProviderDto, ListOfframpProviderDto, ProviderActionDto } from '@rahataid/extensions';
import { PaginatorTypes, PrismaService, paginator } from "@rumsan/prisma";
import { KotaniPayService } from './offrampProviders/kotaniPay.service';


const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class OfframpService {
  constructor(
    private prisma: PrismaService,
    private kotaniPayService: KotaniPayService
  ) { }

  registerProvider(createOfframpDto: CreateOfframpProviderDto) {
    console.log({ createOfframpDto });
    return this.prisma.offrampProvider.create({
      data: createOfframpDto
    })
  }

  listProviders(query?: ListOfframpProviderDto) {
    const where = {
      deletedAt: null
    }
    return paginate(this.prisma.offrampProvider, {
      where,
      select: {
        id: true,
        uuid: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
        extras: true
      }
    }, {
      page: query.page || 1,
      perPage: query.perPage || 10,
    });
  }
  getProviderById(uuid: string) {
    return this.prisma.offrampProvider.findUnique({
      where: {
        uuid
      }
    });
  }

  async providerActions(data: ProviderActionDto) {
    console.log({ data });

    const offrampProvider = await this.getProviderById(data.uuid);
    if (!offrampProvider) {
      throw new BadRequestException('Offramp provider not found');
    }

    if (offrampProvider.name === 'Kotani Pay') {
      const action = this.kotaniPayService.kotaniPayActions[data.action];
      if (action) {
        return action(data);
      }
    }

    // Handle other providers here

    return {
      success: false,
      message: "Action not found",
      error_code: 404
    };
  }

  create(createOfframpDto: CreateOfframpProviderDto) {
    console.log({ createOfframpDto });
    return this.prisma.offrampProvider.create({
      data: createOfframpDto
    })
  }

  findAll() {
    return `This action returns all offramp`;
  }

  findOne(id: number) {
    return `This action returns a #${id} offramp`;
  }

  update(id: number, updateOfframpDto: any) {
    return `This action updates a #${id} offramp`;
  }

  remove(id: number) {
    return `This action removes a #${id} offramp`;
  }
}
