import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { WalletJobs } from "@rahataid/sdk";
import { BulkCreateWallet, BulkUpdateWallet, ChainType } from '@rahataid/wallet';
import { BulkWalletAddressDto, PhoneAddressDto, PhoneNumberDto, WalletAddressDto } from './dto/getBy.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) { }

  // Creates a single wallet
  @MessagePattern({ cmd: WalletJobs.CREATE })
  create(chains: ChainType[]) {
    return this.walletService.create(chains);
  }

  // Creates n wallets
  @MessagePattern({ cmd: WalletJobs.CREATE_BULK })
  createBulk(chains: BulkCreateWallet) {
    return this.walletService.createBulk(chains.count);
  }

  // Creates n wallets and updates beneficiaries
  @MessagePattern({ cmd: WalletJobs.UPDATE_BULK })
  updateBulk(chains: BulkUpdateWallet) {
    return this.walletService.updateBulk(chains);
  }

  // Gets wallet by phone number
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

  @MessagePattern({ cmd: WalletJobs.GET_BULK_SECRET_BY_WALLET })
  getBulkSecretByWallet(accounts: BulkWalletAddressDto) {
    return this.walletService.getBulkSecretByWallet(accounts);
  }
}
