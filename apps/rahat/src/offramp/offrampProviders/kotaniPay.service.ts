import { Injectable } from '@nestjs/common';
import { ProviderActionDto } from '@rahataid/extensions';
import { KotaniPayExecutionData } from '@rahataid/sdk';
import { PrismaService } from '@rumsan/prisma';
import axios, { AxiosInstance } from 'axios';
import { OfframpService } from './offrampService.interface'; // Adjust the import path as needed

interface OfframpProviderConfig {
  baseUrl: string;
  apiKey: string;
}

type TCreate = {
  chain: string;
  token: string;
  amount: number;
  senderAddress: string;
}

type TCheck = {
  referenceId: string;
}


@Injectable()
export class KotaniPayService implements OfframpService<TCreate, KotaniPayExecutionData, TCheck> {
  constructor(private readonly prisma: PrismaService) { }

  private async getProviderConfig(uuid: string): Promise<OfframpProviderConfig> {
    const offrampProvider = await this.prisma.offrampProvider.findUnique({
      where: { uuid }
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
        'Authorization': `Bearer ${apiKey}`
      }
    });
  }

  async createCustomerMobileMoneyWallet(data: ProviderActionDto) {
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.post('/customer/mobile-money', {
      country_code: data.payload.country_code,
      phone_number: data.payload.phone_number,
      network: data.payload.network,
      account_name: data.payload.account_name
    });

    return { data: response.data };
  }

  async listCustomerMobileMoneyWallet(data: ProviderActionDto) {
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get('/customer/mobile-money');

    return { data: response.data };
  }

  async createFiatWallet(data: ProviderActionDto) {
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.post('/wallet/fiat', {
      currency: data.payload.currency,
      name: data.payload.name,
    })
    console.log({ response });
    return { data: response.data };
  }

  async getFiatWallet(data: ProviderActionDto) {
    console.log({ data });
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get('/wallet/fiat');
    console.log({ response });
    return { data: response.data.data };
  }

  async createOfframpRequest(providerUuid: string, data: TCreate): Promise<any> {
    // Implementation goes here
    const client = await this.getKotaniPayAxiosClient(providerUuid);
    const response = await client.post('/offramp/crypto-to-fiat/mobile-money/request', {
      chain: data.chain,
      token: data.token,
      senders_amount: data.amount,
      senders_address: data.senderAddress
    })
    console.log('response', response)
    return { data: response.data };
  }

  async executeOfframpRequest(providerUuid: string, data: KotaniPayExecutionData): Promise<any> {
    const client = await this.getKotaniPayAxiosClient(providerUuid);
    const response = await client.post('/offramp/crypto-to-fiat/mobile-money', data)
    return { data: response.data };
  }

  async checkOfframpStatus(data: any): Promise<any> {
    console.log('data', data)
    // Implementation goes here
    const client = await this.getKotaniPayAxiosClient(data.uuid);
    const response = await client.get(`/offramp/${data.payload.requestUuid}`);
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
    const response = await client.get('/offramp/crypto-to-fiat/supported-chains');
    return { data: response.data };
  }

  kotaniPayActions = {
    'create-customer-mobile-wallet': this.createCustomerMobileMoneyWallet.bind(this),
    'list-customer-mobile-wallet': this.listCustomerMobileMoneyWallet.bind(this),
    'create-fiat-wallet': this.createFiatWallet.bind(this),
    'get-fiat-wallet': this.getFiatWallet.bind(this),
    'check-offramp-status': this.checkOfframpStatus.bind(this),
    'get-offramp-details': this.checkOfframpStatus.bind(this),
    'get-supported-chains': this.getSupportedChains.bind(this),
    // Add more Kotani Pay actions here
  };
}
