import { BadRequestException, Injectable } from '@nestjs/common';
import { ProviderActionDto } from '@rahataid/extensions';
import { KotaniPayExecutionData } from '@rahataid/sdk';
import { paginator, PrismaService } from '@rumsan/prisma';
import axios, { AxiosInstance } from 'axios';
import { OfframpService } from './offrampService.interface'; // Adjust the import path as needed

const paginate = paginator({ perPage: 20 });

interface OfframpProviderConfig {
  baseUrl: string;
  apiKey: string;
}

type TCreate = {
  chain: string;
  token: string;
  amount: number;
  senderAddress: string;
};

type TCheck = {
  referenceId: string;
};

@Injectable()
export class KotaniPayService
  implements OfframpService<TCreate, KotaniPayExecutionData, TCheck> {
  constructor(private readonly prisma: PrismaService) { }

  private async getProviderConfig(
    uuid: string
  ): Promise<OfframpProviderConfig> {
    const offrampProvider = await this.prisma.offrampProvider.findUnique({
      where: { uuid },
    });

    if (!offrampProvider) {
      throw new Error('Provider not found');
    }

    return offrampProvider.config as unknown as OfframpProviderConfig;
  }

  private async getKotaniPayAxiosClient(uuid: string): Promise<AxiosInstance> {
    const { baseUrl, apiKey } = await this.getProviderConfig(uuid);

    return axios.create({
      baseURL: baseUrl,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
    });
  }

  async createCustomerMobileMoneyWallet(data: ProviderActionDto) {
    const isBeneficiary = await this.prisma.beneficiaryPii.findFirst({
      where: {
        phone: data.payload.country_code + data.payload.phone_number,
      },
    });
    console.log('isBeneficiary', isBeneficiary)
    if (!isBeneficiary) {
      throw new BadRequestException(
        'Should be a valid beneficiary in order to proceed.'
      );
    }
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.post('/customer/mobile-money', {
      country_code: data.payload.country_code,
      phone_number: data.payload.phone_number,
      network: data.payload.network,
      account_name: data.payload.account_name,
    }).catch((e) => {
      throw new BadRequestException(e.response.data);
    })

    return response.data;
  }

  async listCustomerMobileMoneyWallet(data: ProviderActionDto) {
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get('/customer/mobile-money');

    return { data: response.data };
  }

  async createFiatWallet(data: ProviderActionDto) {
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    try {
      const response = await client.post('/wallet/fiat', {
        currency: data.payload.currency,
        name: data.payload.name,
      });
      console.log({ response });
      return { data: response.data };
    } catch (error) {
      return { data: error.response.data };
    }
  }

  async getFiatWallet(data: ProviderActionDto) {
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get('/wallet/fiat');
    return { data: response.data.data };
  }

  async createOfframpRequest(
    providerUuid: string,
    data: TCreate
  ): Promise<any> {
    // Implementation goes here
    const client = await this.getKotaniPayAxiosClient(providerUuid);
    const response = await client
      .post('/offramp/crypto-to-fiat/mobile-money/request', {
        chain: data.chain,
        token: data.token,
        senders_amount: data.amount,
        senders_address: data.senderAddress,
      })
      .catch((e) => {
        throw new BadRequestException(e.response.data);
      });

    console.log('THis is the response from off', response)

    return { data: response.data as any };
  }

  async executeOfframpRequest(
    providerUuid: string,
    data: KotaniPayExecutionData
  ): Promise<any> {
    const client = await this.getKotaniPayAxiosClient(providerUuid);

    const response = await client.post('/offramp', data).catch((e) => {
      console.log('e', e)
      throw new BadRequestException(e.response.data);
    });


    return response.data;
  }

  async checkOfframpStatus(data: any): Promise<any> {
    // Implementation goes here
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get(
      `/offramp/${data.payload.referenceId}`
    );
    // console.log('response', response)
    return { data: response.data };
  }

  async getOfframpDetails(data: any): Promise<any> {
    // Implementation goes here
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get(`/offramp/${data.payload.requestUuid}`);
    return { data: response.data };
  }

  async getSupportedChains(data: any): Promise<any> {
    // Implementation goes here
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get(
      '/offramp/crypto-to-fiat/supported-chains'
    );
    console.log('response', response);
    return { data: response.data };
  }

  async getCustomerWalletByPhone(data) {
    try {
      // Fetch the KotaniPay Axios client using the provided UUID
      const client = await this.getKotaniPayAxiosClient(data.uuid);

      // Retrieve customer wallet data by phone number
      const response = await client.get(`/customer/mobile-money/phone/${data.payload.phone_number}`);
      const customerKey = response.data?.data?.customer_key;
      if (!customerKey) {
        throw new Error('Customer key not found in response');
      }

      // Fetch all offramp transactions for the customer, ordered by creation date (most recent first)
      const offrampTransactions = await this.prisma.offrampTransaction.findMany({
        where: { customerKey },
        orderBy: { createdAt: 'desc' },
      });

      // If transactions exist, update the status of the most recent one
      if (offrampTransactions.length > 0) {
        const transaction = offrampTransactions[0];


        try {
          // Check the status of the most recent transaction using its referenceId
          const statusCheck = await this.checkOfframpStatus({
            uuid: data.uuid,
            payload: { referenceId: transaction.referenceId },
          });
          const transactionStatus = statusCheck.data.data.status;
          const mappedStatus = transactionStatus;

          // Update extras only if there are changes
          const currentExtras = typeof transaction.extras === 'object' && transaction.extras !== null ? transaction.extras : {};
          const newExtras = {
            ...currentExtras,
            ...(statusCheck.data.data as object),
          };
          if (JSON.stringify(newExtras) !== JSON.stringify(currentExtras)) {
            await this.prisma.offrampTransaction.update({
              where: { id: transaction.id },
              data: { extras: newExtras },
            });
            transaction.extras = newExtras; // Reflect the update in memory
          }

          // Update status and txHash only if the status has changed
          if (mappedStatus !== transaction.status) {
            await this.prisma.offrampTransaction.update({
              where: { id: transaction.id },
              data: {
                status: mappedStatus,
                txHash: statusCheck.data.data.transactionHash,
              },
            });
            transaction.status = mappedStatus; // Reflect the update in memory
            transaction.txHash = statusCheck.data.data.transactionHash;
          }
        } catch (error) {
          console.error(`Error updating transaction ${transaction.id}:`, error.message);
          throw error; // Propagate the error to be handled by the outer catch
        }
      }

      // Return the customer wallet data along with all transactions
      return {
        data: {
          ...response.data.data,
          transactions: offrampTransactions,
        },
      };
    } catch (error) {
      console.error('Error in getCustomerWalletByPhone:', error.message);
      throw new Error(`Failed to retrieve customer wallet: ${error.message}`);
    }
  }





  kotaniPayActions = {
    'create-customer-mobile-wallet':
      this.createCustomerMobileMoneyWallet.bind(this),
    'list-customer-mobile-wallet':
      this.listCustomerMobileMoneyWallet.bind(this),
    'create-fiat-wallet': this.createFiatWallet.bind(this),
    'get-fiat-wallet': this.getFiatWallet.bind(this),
    'check-offramp-status': this.checkOfframpStatus.bind(this),
    'get-offramp-details': this.checkOfframpStatus.bind(this),
    'get-supported-chains': this.getSupportedChains.bind(this),
    'get-customer-wallet-by-phone': this.getCustomerWalletByPhone.bind(this),

    // Add more Kotani Pay actions here
  };
}
