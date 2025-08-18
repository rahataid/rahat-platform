import { BadRequestException, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WalletService } from '@rahataid/sdk/enums';
import { PrismaService } from '@rumsan/prisma';
import axios, { AxiosInstance } from 'axios';

@Injectable()
export class XcapitUtilsService {
    constructor(private readonly prisma: PrismaService) { }

    private async getXcapitAxiosClient(): Promise<AxiosInstance> {
        const xcapit = await this.prisma.setting.findUnique({
            where: { name: WalletService.XCAPIT },
        });

        if (!xcapit) {
            throw new RpcException('XCAPIT setting not found');
        }

        const { URL, TOKEN } = xcapit.value as { URL: string; TOKEN: string };

        if (!URL || !TOKEN) {
            throw new RpcException(
                'Missing XCAPIT_URL or XCAPIT_TOKEN or phoneNumber'
            );
        }

        return axios.create({
            baseURL: URL,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${TOKEN}`,
            },
        });
    }

    async bulkGenerateXcapitWallet(
        payload: { phoneNumber: string }[]
    ): Promise<{ phoneNumber: string; walletAddress: string; status: string }[]> {
        const client = await this.getXcapitAxiosClient();
        const response = await client
            .post('/api/beneficiaries/bulk', payload)
            .catch((e) => {
                throw new BadRequestException(e.response.data);
            });
        return response.data;
    }

    async generateXCapitWallet(
        phoneNumber: string
    ): Promise<{ phoneNumber: string; address: string; active: Boolean }> {
        const client = await this.getXcapitAxiosClient();
        const response = await client
            .post('/api/beneficiaries', { phoneNumber })
            .catch((e) => {
                throw new BadRequestException(e.response.data);
            });
        return response.data;
    }
}
