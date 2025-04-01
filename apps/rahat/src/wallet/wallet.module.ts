import { Module } from '@nestjs/common';
import { SettingsModule } from '@rumsan/extensions/settings';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [SettingsModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule { }
