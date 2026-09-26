import { Global, Module } from '@nestjs/common';
import { EVMWallet, StellarWallet } from '@rahataid/wallet';
import { PrismaService } from '@rumsan/prisma';
import { SettingsModule } from '@rumsan/extensions/settings';
import {
  BLOCKCHAIN_REGISTRY_TOKEN,
  BlockchainProviderRegistry,
} from './providers/blockchain-provider.registry';
import { CompositeWalletStorage } from './storages/composite.storage';
import { DatabaseWalletStorage } from './storages/database.storage';
import { FileWalletStorage } from './storages/fs.storage';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { XcapitService } from './xcapit.service';

@Global()
@Module({
  imports: [SettingsModule],
  controllers: [WalletController],
  providers: [
    WalletService,
    BlockchainProviderRegistry.register({
      wallets: [EVMWallet, StellarWallet],
      storageFactory: (prisma: PrismaService) =>
        new CompositeWalletStorage([
          new DatabaseWalletStorage(prisma), // primary: DB (fast lookup, entity-aware)
          new FileWalletStorage(),            // secondary: file (backup / offline recovery)
        ]),
      inject: [PrismaService],
      defaultConfigs: {
        evm: {
          rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
        },
        stellar: {
          rpcUrl: 'https://stellar-soroban-public.nodies.app',
        },
      },
    }),
    XcapitService,
  ],
  exports: [WalletService, BLOCKCHAIN_REGISTRY_TOKEN, XcapitService],
})
export class WalletModule {}
