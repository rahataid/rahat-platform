import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateOfframpProviderDto, CreateOfframpRequestDto, ListOfframpProviderDto, ListOfframpRequestDto, ProviderActionDto } from '@rahataid/extensions';
import { PaginatorTypes, PrismaService, paginator } from "@rumsan/prisma";
import { randomUUID } from 'crypto';
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
    const offrampExists = await this.prisma.offrampRequest.findUnique({
      where: {
        requestId: kotaniPayResponse?.data.request_id
      }
    });
    if (offrampExists) {
      throw new BadRequestException('Offramp request already exists');
    }
    return this.prisma.offrampRequest.create({

      data: {
        ...offrampRequestData,
        requestId: kotaniPayResponse?.data.request_id,
        escrowAddress: kotaniPayResponse?.data.escrow_address
      }
    })
  }

  //TODO: Geenralize the offramp request execution
  async executeOfframpRequest(executeOfframpData: any) {
    console.log({ executeOfframpData });
    const { providerUuid, ...data } = executeOfframpData;
    // const request = await this.prisma.offrampRequest.findUniqueOrThrow({
    //   where: {
    //     uuid: requestUuid
    //   }
    // });
    // if (!request) {
    // throw new BadRequestException('Offramp request not found');
    // }


    const executionData = {
      mobileMoneyReceiver: data.data.mobileMoneyReceiver,
      senderAddress: data.data.senderAddress,
      chain: data.data.chain,
      token: data.data.token,
      cryptoAmount: +data.data.cryptoAmount,
      currency: data.data.currency,
      referenceId: randomUUID()
    }
    console.log(JSON.stringify(executionData, null, 2));
    try {
      const { data: kotaniPayResponse } = await this.kotaniPayService.executeOfframpRequest(providerUuid, executionData)
      console.log('kota', kotaniPayResponse)

      const transaction = await this.prisma.offrampTransaction.create({
        data: {
          txHash: data.data.transaction_hash || '',
          chain: data.data.chain,
          token: data.data.token,
          walletId: data.data.wallet_id,
          customerKey: data.data.customer_key,
          referenceId: executionData.referenceId,
          offrampRequest: {
            connectOrCreate: {
              where: {
                requestId: executionData.referenceId
              },
              create: {
                chain: data.data.chain,
                token: data.data.token,
                senderAddress: data.data.senderAddress,
                amount: +data.data.cryptoAmount,
                requestId: executionData.referenceId,
                escrowAddress: kotaniPayResponse?.escrow_address,
                status: 'PENDING',
                extras: {
                  mobileMoneyReceiver: executionData.mobileMoneyReceiver,
                  currency: executionData.currency,
                  cryptoAmount: executionData.cryptoAmount
                }

              }
            }
          }
        }
      });

      return { transaction, kotaniPayResponse };
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.response.message);

    }


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
    if (payload.uuid) {
      return this.prisma.offrampRequest.findUniqueOrThrow({
        where: { uuid: payload.uuid }
      });
    }
    if (payload.id) {
      return this.prisma.offrampRequest.findUniqueOrThrow({
        where: { id: payload.id }
      });
    }
    if (payload.requestId) {
      return this.prisma.offrampRequest.findUniqueOrThrow({
        where: { requestId: payload.requestId }
      });
    }
    throw new BadRequestException('Must provide either uuid, id or requestId');
  }

  update(id: number, updateOfframpDto: any) {
    return `This action updates a #${id} offramp`;
  }

  remove(id: number) {
    return `This action removes a #${id} offramp`;
  }

  async findAllTransactions(payload: {
    uuid?: string;
    id?: number;
    requestId?: string;
    page?: number;
    perPage?: number;
    walletAddress?: string;
  }) {
    console.log('payload', payload)
    const where = {
      deletedAt: null
    };
    if (payload.uuid) {
      where['offrampRequest'] = {
        uuid: payload.uuid
      }
    }
    if (payload.id) {
      where['offrampRequest'] = {
        id: payload.id
      }
    }
    if (payload.requestId) {
      where['offrampRequest'] = {
        requestId: payload.requestId
      }
    }

    if (payload.walletAddress) {
      const ben = await this.prisma.beneficiary.findUnique({
        where: {
          walletAddress: payload.walletAddress
        },
        include: {
          pii: true
        }
      });
      if (ben) {
        console.log('ben', ben)
      }
      // where['offrampRequest'] = {
    }
    console.log('where', where)

    return paginate(this.prisma.offrampTransaction, {
      where,
      include: {
        offrampRequest: true
      }
    }, {
      page: payload.page || 1,
      perPage: payload.perPage || 20,
    });
  }
}
