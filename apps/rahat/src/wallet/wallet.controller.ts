import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  // @Post()
  // create(
  // ) {
  //   return this.walletService.create();
  // }

  // @Get()
  // signAndSend() {
  //   return this.walletService.signAndSend();
  // }

}
