import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { WalletJobs } from "@rahataid/sdk";
import { BulkCreateWallet, ChainType } from '@rahataid/wallet';
import { PhoneAddressDto, PhoneNumberDto, WalletAddressDto } from './dto/getBy.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  @MessagePattern({ cmd: WalletJobs.CREATE })
  create(chains: ChainType[]) {
    return this.walletService.create(chains);
  }

  @MessagePattern({ cmd: WalletJobs.CREATE_BULK })
  createBulk(chains: BulkCreateWallet) {
    return this.walletService.createBulk(chains);
  }

  @MessagePattern({ cmd: WalletJobs.GET_WALLET_BY_PHONE })
  getWalletByPhone(phoneDto: PhoneNumberDto) {
    return this.walletService.getWalletByPhone(phoneDto.phoneNumber);
  }

  @MessagePattern({ cmd: WalletJobs.GET_SECRET_BY_PHONE })
  getSecretByPhone(account: PhoneAddressDto) {
    return this.walletService.getSecretByPhone(account.phoneNumber, account.chain);
  }

  @MessagePattern({ cmd: WalletJobs.GET_SECRET_BY_WALLET })
  getSecretByWallet(account: WalletAddressDto) {
    return this.walletService.getSecretByWallet(account.walletAddress, account.chain);
  }
}
