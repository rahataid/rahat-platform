import { Global, Module } from '@nestjs/common';
import { SettingsModule } from '@rumsan/extensions/settings';
import { EVMWallet, StellarWallet } from '@rahataid/wallet';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { FileWalletStorage } from './storages/fs.storage';
import {
  BlockchainProviderRegistry,
  BLOCKCHAIN_REGISTRY_TOKEN,
} from './providers/blockchain-provider.registry';

@Global()
@Module({
  imports: [SettingsModule],
  controllers: [WalletController],
  providers: [
    WalletService,
    BlockchainProviderRegistry.register({
      wallets: [EVMWallet, StellarWallet],
      storage: FileWalletStorage,
      defaultConfigs: {
        evm: {
          rpcUrl: 'https://base-sepolia-rpc.publicnode.com',
        },
        stellar: {
          rpcUrl: 'https://stellar-soroban-public.nodies.app',
        },
      },
    }),
  ],
  exports: [WalletService, BLOCKCHAIN_REGISTRY_TOKEN],
})
export class WalletModule {}
