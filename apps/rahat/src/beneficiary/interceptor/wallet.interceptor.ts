import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ChainType } from '@rahataid/wallet';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WalletService } from '../../wallet/wallet.service';

@Injectable()
export class WalletInterceptor implements NestInterceptor {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly walletService: WalletService,
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        const data = request.body;

        const walletAddress = await this.ensureValidWalletAddress(data.walletAddress);

        request.body.walletAddress = walletAddress;

        return next.handle().pipe(
            map(response => ({
                ...response,
                walletAddress,
            }))
        );

    }

    private async ensureValidWalletAddress(walletAddress?: string): Promise<string> {
        const chain = await this.getChainName();

        if (!walletAddress) {
            const result = await this.walletService.create([chain])
            return result[0].address;
        }

        const existingBeneficiary = await this.prismaService.beneficiary.findUnique({
            where: { walletAddress },
        });

        if (existingBeneficiary) {
            console.log('Wallet address already exists');
            throw new RpcException('Wallet address already exists');
        }

        return walletAddress;
    }

    private async getChainName(): Promise<ChainType> {
        const settings = new SettingsService(this.prismaService);
        const contractSettings = await settings.getByName('CHAIN_SETTINGS');
        return contractSettings.value.nativeCurrency.symbol;
    }
}