// wallet.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { WalletServiceType } from '@rahataid/sdk/enums';
import { ChainType } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WalletService } from '../../wallet/wallet.service';
import { XcapitService } from '../../wallet/xcapit.service';

@Injectable()
export class WalletInterceptor implements NestInterceptor {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly walletService: WalletService,
    private readonly xcapitService: XcapitService
  ) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const data = request.body;

    const xcapit = await this.prismaService.setting.findUnique({
      where: { name: WalletServiceType.XCAPIT },
    });

    try {
      const isArrayInput = Array.isArray(data);
      const items = isArrayInput ? data : [data]; // normalize to array

      let updatedItems: any[];

      if (xcapit) {
        updatedItems = await this.attachXcapitWallets(items);
      } else {
        // Validate/ensure wallet addresses for all items
        updatedItems = await Promise.all(
          items.map(async (item) => {
            const walletAddress = await this.ensureValidWalletAddress(
              item.walletAddress
            );
            return { ...item, walletAddress };
          })
        );
      }

      // Restore single object if original input was not an array
      request.body = isArrayInput ? updatedItems : updatedItems[0];

      return next.handle().pipe(map((response) => ({ ...response })));
    } catch (error) {
      console.error('Wallet processing failed:', error);

      throw error instanceof RpcException
        ? error
        : new RpcException('Wallet processing failed');
    }
  }

  private async attachXcapitWallets(items: any[]) {
    // Collect phones
    const phones = items
      .map((d) => d?.piiData?.phone)
      .filter(Boolean)
      .map((phone) => ({ phoneNumber: phone }));

    // Bulk generate wallets
    const bulkRes = await this.xcapitService.bulkGenerateXcapitWallet(phones);

    // Build phone → wallet mapping
    const phoneToWallet = Object.fromEntries(
      bulkRes?.map((b) => [b.phoneNumber, b.walletAddress]) || []
    );

    // Attach wallet addresses to items
    return items.map((d) => ({
      ...d,
      walletAddress: phoneToWallet[d?.piiData?.phone] || d.walletAddress,
    }));
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
