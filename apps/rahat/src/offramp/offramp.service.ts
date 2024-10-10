import { Injectable } from '@nestjs/common';
import { CreateOfframpProviderDto, ListOfframpProviderDto, ProviderActionDto } from '@rahataid/extensions';
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

  providerActions(data: ProviderActionDto) {
    console.log({ data });
    if (data.action === 'create-customer-mobile-wallet') {
      return {
        "success": true,
        "message": "Customer has been successfully created.",
        "data": {
          "phone_number": "+254722154745 ",
          "country_code": "KE",
          "customer_key": "QozR5knCfvkdAezXT7rx",
          "integrator": "66d93d7524321e43c9245c9a",
          "account_name": "rumsan-tester",
          "network": "AIRTEL"
        }
      }
    }
    if (data.action === 'create-fiat-wallet') {
      console.log({ data });
      return {
        "success": false,
        "message": "WALLET_ALREADY_EXIST",
        "error_code": 409
      }
    }
    return {
      "success": false,
      "message": "Action not found",
      "error_code": 404
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
