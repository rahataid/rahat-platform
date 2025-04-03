import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { WalletJobs } from "@rahataid/sdk";
import { ChainType } from '@rahataid/wallet';
import { PhoneNumberDto } from './dto/get-wallet-by-phone.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @MessagePattern({ cmd: WalletJobs.CREATE })
  create(chains: ChainType[]) {
    return this.walletService.create(chains);
  }

  @MessagePattern({ cmd: WalletJobs.GET_WALLET_BY_PHONE })
  getWalletByPhone(phoneDto: PhoneNumberDto) {
    return this.walletService.getWalletByPhone(phoneDto.phoneNumber);
  }

}
