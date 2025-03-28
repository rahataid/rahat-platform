import { Module } from '@nestjs/common';
import { SettingsModule } from '@rumsan/extensions/settings';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [SettingsModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService] // Export WalletService so it can be used in other modules
})
export class WalletModule { }
