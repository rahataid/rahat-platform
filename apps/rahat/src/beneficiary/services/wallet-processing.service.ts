// wallet-processing.service.ts
import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WalletServiceType } from '@rahataid/sdk/enums';
import { ChainType } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { WalletService } from '../../wallet/wallet.service';
import { XcapitService } from '../../wallet/xcapit.service';

@Injectable()
export class WalletProcessingService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly walletService: WalletService,
        private readonly xcapitService: XcapitService
    ) { }

    async processBeneficiariesWithWallets(beneficiaries: any[]): Promise<any[]> {
        if (!beneficiaries || !Array.isArray(beneficiaries)) {
            console.log('No beneficiaries provided for wallet processing');
            return beneficiaries;
        }

        console.log(`Processing wallet addresses for ${beneficiaries.length} beneficiaries`);

        const xcapit = await this.prismaService.setting.findUnique({
            where: { name: WalletServiceType.XCAPIT },
        });

        try {
            let updatedBeneficiaries: any[];

            if (xcapit) {
                updatedBeneficiaries = await this.attachXcapitWallets(beneficiaries);
                console.log({ updatedBeneficiaries });
            } else {
                // Validate/ensure wallet addresses for all items
                updatedBeneficiaries = await Promise.all(
                    beneficiaries.map(async (item) => {
                        const walletAddress = await this.ensureValidWalletAddress(
                            item.walletAddress
                        );
                        return { ...item, walletAddress };
                    })
                );
            }

            return updatedBeneficiaries;
        } catch (error) {
            console.error('Wallet processing failed:', error);

            throw error instanceof RpcException
                ? error
                : new RpcException('Wallet processing failed');
        }
    }

    private async attachXcapitWallets(items: any[]) {
        // Collect phones
        try {
            const phones = items
                .map((d) => d?.piiData?.phone)
                .filter(Boolean)
                .map((phone) => ({ phoneNumber: phone }));

            console.log('Processing phones for Xcapit wallets:', phones);

            // Bulk generate wallets
            const bulkRes = await this.xcapitService.bulkGenerateXcapitWallet(phones);
            console.log(bulkRes)

            // Build phone → wallet mapping
            const phoneToWallet = Object.fromEntries(
                bulkRes?.map((b) => [b.phoneNumber, b.walletAddress]) || []
            );

            // Attach wallet addresses to items
            return items.map((d) => ({
                ...d,
                walletAddress: phoneToWallet[d?.piiData?.phone] || d.walletAddress,
            }));
        } catch (e) {
            console.log(e)
        }
    }

    private async ensureValidWalletAddress(
        walletAddress?: string
    ): Promise<string> {
        if (!walletAddress) {
            const result = await this.walletService.createWallet();
            console.log('Created new wallet for chain:', result.address);
            return result.address;
        }

        // Validate address format and detect chain type
        try {
            const isValid = await this.walletService.validateAddress(walletAddress);
            if (!isValid) {
                throw new RpcException(
                    `Invalid wallet address format: ${walletAddress}`
                );
            }
        } catch (error) {
            throw new RpcException(`Invalid wallet address: ${error.message}`);
        }

        // Check if wallet address already exists
        const existingBeneficiary = await this.prismaService.beneficiary.findUnique(
            {
                where: { walletAddress },
            }
        );

        if (existingBeneficiary) {
            console.log('Wallet address already exists');
            throw new RpcException('Wallet address already exists');
        }

        return walletAddress;
    }

    private async getDefaultChain(): Promise<ChainType> {
        try {
            return await this.walletService.getDefaultChain();
        } catch (error) {
            console.warn(
                'Failed to get default chain from wallet service, falling back to settings detection'
            );
            return this.getChainFromSettings();
        }
    }

    private async getChainFromSettings(): Promise<ChainType> {
        const settings = new SettingsService(this.prismaService);
        const contractSettings = await settings.getByName('CHAIN_SETTINGS');
        const contractValue = contractSettings?.value as {
            type: string;
        };

        if (!contractValue?.type) {
            throw new Error(
                'Chain configuration must include a "type" field (evm or stellar)'
            );
        }

        return contractValue.type as ChainType;
    }
}
