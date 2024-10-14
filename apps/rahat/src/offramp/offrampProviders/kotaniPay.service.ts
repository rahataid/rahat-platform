import { Injectable } from '@nestjs/common';
import { ProviderActionDto } from '@rahataid/extensions';
import { PrismaService } from '@rumsan/prisma'; // Adjust the import path as needed
import axios from 'axios';

interface OfframpProviderConfig {
    baseUrl: string;
    apiKey: string;
}

@Injectable()
export class KotaniPayService {
    constructor(private readonly prisma: PrismaService) { }

    async createCustomerMobileMoneyWallet(data: ProviderActionDto) {
        try {
            const offrampProvider = await this.prisma.offrampProvider.findUnique({
                where: { uuid: data.uuid }
            });

            if (!offrampProvider) {
                throw new Error('Provider not found');
            }

            const config = offrampProvider.config as unknown as OfframpProviderConfig;
            const { baseUrl, apiKey } = config;
            const response = await axios.post(
                `${baseUrl}/customer/mobile-money`,
                {
                    country_code: data.payload.country_code,
                    phone_number: data.payload.phone_number,
                    network: data.payload.network,
                    account_name: data.payload.account_name
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    }
                }
            );

            if (response && response.data) {
                return {
                    message: "Customer has been successfully created.",
                    data: response.data
                };
            } else {
                throw new Error('Invalid response from KotaniPay API');
            }
        } catch (error) {
            console.error('Error creating customer mobile money wallet:', error);
            throw new Error('Failed to create customer mobile money wallet');
        }
    }

    createFiatWallet(data: ProviderActionDto) {
        return {
            success: false,
            message: "WALLET_ALREADY_EXIST",
            error_code: 409
        };
    }

    kotaniPayActions = {
        'create-customer-mobile-wallet': this.createCustomerMobileMoneyWallet.bind(this),
        'create-fiat-wallet': this.createFiatWallet,
        // Add more Kotani Pay actions here
    };
}
