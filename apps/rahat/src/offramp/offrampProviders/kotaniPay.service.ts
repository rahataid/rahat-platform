import { Injectable } from '@nestjs/common';
import { ProviderActionDto } from '@rahataid/extensions';
import { PrismaService } from '@rumsan/prisma'; // Adjust the import path as needed
import axios, { AxiosInstance } from 'axios';

interface OfframpProviderConfig {
    baseUrl: string;
    apiKey: string;
}

type mobileMoneyOfframpRequest = {
    chain: string;
    token: string;
    amount: number;
    senderAddress: string;
}

@Injectable()
export class KotaniPayService {
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
        return { data: response.data };
    }

    async createMobileMoneyOfframpRequest(providerUuid: string, data: mobileMoneyOfframpRequest) {
        const client = await this.getKotaniPayAxiosClient(providerUuid);
        const response = await client.post('/offramp/crypto-to-fiat/mobile-money/request', {
            chain: data.chain,
            token: data.token,
            senders_amount: data.amount,
            senders_address: data.senderAddress
        })
        return { data: response.data };
    }
    kotaniPayActions = {
        'create-customer-mobile-wallet': this.createCustomerMobileMoneyWallet.bind(this),
        'list-customer-mobile-wallet': this.listCustomerMobileMoneyWallet.bind(this),
        'create-fiat-wallet': this.createFiatWallet.bind(this),
        // Add more Kotani Pay actions here
    };
}
