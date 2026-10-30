import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { WalletJobs } from '@rahataid/sdk';
import { SignSponsorshipTxDto, StellarSponsorService } from './stellar-sponsor.service';

@Controller()
export class StellarSponsorController {
  constructor(private readonly stellarSponsorService: StellarSponsorService) {}

  @MessagePattern({ cmd: WalletJobs.GET_CORE_SPONSOR_STATUS })
  getCoreSponsorStatus() {
    return this.stellarSponsorService.getCoreSponsorStatus();
  }

  @MessagePattern({ cmd: WalletJobs.SIGN_SPONSORSHIP_TX })
  signSponsorshipTx(dto: SignSponsorshipTxDto) {
    return this.stellarSponsorService.signSponsorshipTx(dto);
  }
}
