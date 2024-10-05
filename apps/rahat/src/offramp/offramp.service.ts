import { Injectable } from '@nestjs/common';
import { CreateOfframpProviderDto, ListOfframpProviderDto } from '@rahataid/extensions';
import { PaginatorTypes, PrismaService, paginator } from "@rumsan/prisma";


const paginate: PaginatorTypes.PaginateFunction = paginator({ perPage: 20 });

@Injectable()
export class OfframpService {
  constructor(private prisma: PrismaService) { }

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
      where
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

  providerActions(uuid: string, action: string) {
    if (action === 'delete') {
      return this.prisma.offrampProvider.update({
        where: {
          uuid
        },
        data: {
          deletedAt: new Date()
        }
      });
    }
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
