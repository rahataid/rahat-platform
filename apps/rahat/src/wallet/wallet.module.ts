import { Global, Module } from '@nestjs/common';
import { SettingsModule } from '@rumsan/extensions/settings';
import { EVMWallet, StellarWallet } from '@rahataid/wallet';
import { PrismaModule, PrismaService } from '@rumsan/prisma';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { FileWalletStorage } from './storages/fs.storage';
import { PostgresWalletStorage } from './storages/postgres.storage';
import {
  BlockchainProviderRegistry,
  BLOCKCHAIN_REGISTRY_TOKEN,
} from './providers/blockchain-provider.registry';

@Global()
@Module({
  imports: [SettingsModule, PrismaModule],
  controllers: [WalletController],
  providers: [
    WalletService,
    {
      provide: BLOCKCHAIN_REGISTRY_TOKEN,
      inject: [PrismaService],
      useFactory: async (prisma: PrismaService) => {
        const backend = process.env.WALLET_STORAGE_BACKEND || 'file';
        let storage;
        if (backend === 'file') storage = new FileWalletStorage();
        else if (backend === 'postgres') {
          storage = new PostgresWalletStorage(prisma, process.env.WALLET_STORAGE_ENCRYPTION_KEY);
        } else {
          throw new Error(`Unsupported WALLET_STORAGE_BACKEND: ${backend}`);
        }
        await storage.init();
        return new BlockchainProviderRegistry(storage, [EVMWallet, StellarWallet], {
          evm: { rpcUrl: 'https://base-sepolia-rpc.publicnode.com' },
          stellar: { rpcUrl: 'https://stellar-soroban-public.nodies.app' },
        });
      },
    },
  ],
  exports: [WalletService, BLOCKCHAIN_REGISTRY_TOKEN],
})
export class WalletModule {}
