import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateOfframpProviderDto, CreateOfframpRequestDto, ExecuteOfframpRequestDto, ListOfframpProviderDto, ListOfframpRequestDto, ProviderActionDto } from '@rahataid/extensions';
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

  async createOfframpRequest(createOfframpData: CreateOfframpRequestDto) {
    console.log({ createOfframpData });
    const { providerUuid, ...offrampRequestData } = createOfframpData;
    const { data: kotaniPayResponse } = await this.kotaniPayService.createOfframpRequest(providerUuid, offrampRequestData);
    return this.prisma.offrampRequest.create({
      data: { ...offrampRequestData, requestId: kotaniPayResponse?.data.request_id, escrowAddress: kotaniPayResponse?.data.escrow_address }
    })
  }

  //TODO: Geenralize the offramp request execution
  async executeOfframpRequest(executeOfframpData: ExecuteOfframpRequestDto) {
    console.log({ executeOfframpData });
    const { providerUuid, requestUuid, ...data } = executeOfframpData;
    const request = await this.prisma.offrampRequest.findUnique({
      where: {
        uuid: requestUuid
      }
    });
    console.log({ request });
    if (!request) {
      throw new BadRequestException('Offramp request not found');
    }
    const executionData = {
      chain: data.data.chain,
      token: data.data.token,
      transaction_hash: data.data.transaction_hash,
      wallet_id: data.data.wallet_id,
      request_id: data.data.request_id,
      customer_key: data.data.customer_key
    }
    console.log({ executionData });
    const { data: kotaniPayResponse } = await this.kotaniPayService.executeOfframpRequest(providerUuid, executionData).catch((error) => {
      console.log({ error });
      throw new BadRequestException(error.message);
    });
    console.log({ kotaniPayResponse });

    const transaction = await this.prisma.offrampTransaction.create({
      data: {
        txHash: data.data.transaction_hash,
        chain: data.data.chain,
        token: data.data.token,
        walletId: data.data.wallet_id,
        customerKey: data.data.customer_key,
        referenceId: kotaniPayResponse.data.reference_id,
        offrampRequest: {
          connect: { id: request.id }
        }
      }
    });

    return { transaction, kotaniPayResponse };
    // const { data: kotaniPayResponse } = await this.kotaniPayService.executeOfframpRequest(providerUuid, offrampRequestData);
    // return this.prisma.offrampRequest.update({
    //   where: { id: offrampRequestData.id },
    //   data: { ...offrampRequestData, transactionHash: kotaniPayResponse?.data.transaction_hash }
    // })
  }

  findAllOfframpRequests(query?: ListOfframpRequestDto) {
    const where = {
      deletedAt: null
    };

    return paginate(this.prisma.offrampRequest, {
      where
    }, {
      page: query?.page || 1,
      perPage: query?.perPage || 10,
    });
  }

  findOne(payload: {
    uuid?: string;
    id?: number;
    requestId?: string;

  }) {
    const where: Prisma.OfframpRequestWhereInput = {};
    if (payload.uuid) where.uuid = payload.uuid;
    if (payload.id) where.id = payload.id;
    if (payload.requestId) where.requestId = payload.requestId;
    console.log('where', where)

    return this.prisma.offrampRequest.findFirst({
      where
    });
  }

  update(id: number, updateOfframpDto: any) {
    return `This action updates a #${id} offramp`;
  }

  remove(id: number) {
    return `This action removes a #${id} offramp`;
  }
}
