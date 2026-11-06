// wallet-processing.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WalletServiceType } from '@rahataid/sdk/enums';
import { ChainType } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { WalletService } from '../../wallet/wallet.service';
import { XcapitService } from '../../wallet/xcapit.service';

@Injectable()
export class WalletProcessingService {
    private readonly logger = new Logger(WalletProcessingService.name)
    constructor(
        private readonly prismaService: PrismaService,
        private readonly walletService: WalletService,
        private readonly xcapitService: XcapitService
    ) { }

    async processBeneficiariesWithWallets(beneficiaries: any[]): Promise<{
        validBeneficiaries: any[];
        discardedBeneficiaries: { phoneNumber: string; status: string }[];
        totalProcessed: number;
        totalDiscarded: number;
    }> {
        if (!beneficiaries || !Array.isArray(beneficiaries)) {
            this.logger.log('No beneficiaries provided for wallet processing');
            return {
                validBeneficiaries: beneficiaries,
                discardedBeneficiaries: [],
                totalProcessed: beneficiaries.length,
                totalDiscarded: 0
            };
        }

        this.logger.log(`Processing wallet addresses for ${beneficiaries.length} beneficiaries`);

        const xcapit = await this.prismaService.setting.findUnique({
            where: { name: WalletServiceType.XCAPIT },
        });

        try {
            let result: {
                validBeneficiaries: any[];
                discardedBeneficiaries: { phoneNumber: string; status: string }[];
                totalProcessed: number;
                totalDiscarded: number;
            };

            if (xcapit) {
                result = await this.attachXcapitWallets(beneficiaries);
            } else {
                // Validate/ensure wallet addresses for all items
                const updatedBeneficiaries = await Promise.all(
                    beneficiaries.map(async (item) => {
                        const { walletAddress, multiChainWallets } = await this.ensureValidWalletAddress(
                            item.walletAddress
                        );
                        return { ...item, walletAddress, multiChainWallets };
                    })
                );
                result = {
                    validBeneficiaries: updatedBeneficiaries,
                    discardedBeneficiaries: [],
                    totalProcessed: updatedBeneficiaries.length,
                    totalDiscarded: 0
                };
            }
            this.logger.log(`Beneficiaires processed, ${result.totalProcessed},tota discarded ,${result?.totalDiscarded}`)
            return result;
        } catch (error) {
            this.logger.error('Wallet processing failed:', error);

            throw error instanceof RpcException
                ? error
                : new RpcException({
                    message: 'Wallet processing failed',
                    code: 'WALLET_PROCESSING_FAILED',
                });
        }
    }

    private async attachXcapitWallets(items: any[]): Promise<{
        validBeneficiaries: any[];
        discardedBeneficiaries: { phoneNumber: string; status: string }[];
        totalProcessed: number;
        totalDiscarded: number;
    }> {
        // Collect phones
        try {
            const phones = items
                .map((d) => d?.piiData?.phone)
                .filter(Boolean)
                .map((phone) => ({ phoneNumber: phone }));

            this.logger.log('Processing phones for Xcapit wallets:', phones);

            // Bulk generate wallets
            const bulkRes = await this.xcapitService.bulkGenerateXcapitWallet(phones);

            // Filter successful responses and build phone → wallet mapping
            const successfulResponses = bulkRes?.filter((response) =>
                response.status === 'success' && response.walletAddress
            ) || [];

            const failedResponses = bulkRes?.filter((response) =>
                response.status !== 'success' || !response.walletAddress
            ) || [];

            // Build phone → wallet mapping only for successful responses
            const phoneToWallet = Object.fromEntries(
                successfulResponses.map((b) => [b.phoneNumber, b.walletAddress])
            );

            // Filter items to only include those with successful wallet creation
            const validItems = items.filter((item) => {
                const phone = item?.piiData?.phone;
                return phone && phoneToWallet.hasOwnProperty(phone);
            });

            // Attach wallet addresses to valid items
            const updatedItems = validItems.map((d) => ({
                ...d,
                walletAddress: phoneToWallet[d?.piiData?.phone] || d.walletAddress,
            }));

            this.logger.log(`Successfully processed ${updatedItems.length} out of ${items.length} beneficiaries with Xcapit wallets`);

            return {
                validBeneficiaries: updatedItems,
                discardedBeneficiaries: failedResponses.map(response => ({
                    phoneNumber: response.phoneNumber,
                    status: response.status
                })),
                totalProcessed: items.length,
                totalDiscarded: failedResponses.length
            };
        } catch (e) {
            console.log(e)
            this.logger.log(e)
            throw e instanceof RpcException ? e : new RpcException('Xcapit Wallet creation  failed');
        }

    }

    private async ensureValidWalletAddress(
        walletAddress?: string
    ): Promise<{ walletAddress: string; multiChainWallets: { chain: ChainType; address: string; privateKey: string }[] }> {
        if (!walletAddress) {
            this.logger.log('[WALLET] No address provided, generating multi-chain wallets');
            const results = await this.walletService.createBulkForAllChains(1);
            const defaultResult = results[0];
            const chains = defaultResult.wallets.map(w => w.chain).join(', ');
            this.logger.log(`[WALLET] Multi-chain wallets created on chains: [${chains}], default address: ${defaultResult.defaultAddress}`);
            return {
                walletAddress: defaultResult.defaultAddress,
                multiChainWallets: defaultResult.wallets.map(w => ({
                    chain: w.chain,
                    address: w.address,
                    privateKey: w.privateKey
                }))
            };
        }

        this.logger.log(`[WALLET] Validating provided address: ${walletAddress}`);
        // Validate address format and detect chain type
        try {
            const isValid = await this.walletService.validateAddress(walletAddress);
            if (!isValid) {
                this.logger.warn(`[WALLET] Address format invalid: ${walletAddress}`);
                throw new RpcException({
                    message: `Invalid wallet address format: ${walletAddress}`,
                    code: 'INVALID_WALLET_ADDRESS_FORMAT',
                    params: { addr: walletAddress },
                });
            }
        } catch (error) {
            if (error instanceof RpcException) throw error;
            throw new RpcException({
                message: `Invalid wallet address: ${error.message}`,
                code: 'INVALID_WALLET_ADDRESS',
                params: { message: error.message },
            });
        }

        // Check if wallet address already exists
        const existingBeneficiary = await this.prismaService.beneficiary.findUnique(
            {
                where: { walletAddress },
            }
        );

        if (existingBeneficiary) {
            this.logger.warn(`[WALLET] Address already in use: ${walletAddress}`);
            throw new RpcException({
                message: 'Wallet address already exists',
                code: 'WALLET_ADDRESS_ALREADY_EXISTS',
            });
        }

        this.logger.log(`[WALLET] Address valid, using provided: ${walletAddress}`);
        // Provided address — no multi-chain wallets generated
        return { walletAddress, multiChainWallets: [] };
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
            throw new RpcException({
                message:
                    'Chain configuration must include a "type" field (evm or stellar)',
                code: 'CHAIN_CONFIG_MISSING_TYPE',
            });
        }

        return contractValue.type as ChainType;
    }
}

