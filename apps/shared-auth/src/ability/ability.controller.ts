import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  SharedAuthJobs
} from '@rahataid/sdk';
import { AbilityService } from './ability.service';

@Controller()
export class AbilityController {
  constructor(private readonly abilityService: AbilityService) { }

  @MessagePattern({ cmd: SharedAuthJobs.CHECK_ABILITY })
  checkAbility(
    @Payload()
    payload: {
      userId: number;
      action: string;
      subject: string;
      conditions?: any;
    },
  ) {
    return this.abilityService.checkAbility(payload);
  }

  @MessagePattern({ cmd: SharedAuthJobs.GET_USER_ABILITIES })
  getUserAbilities(@Payload() payload: { userId: number }) {
    return this.abilityService.getUserAbilities(payload);
  }
}
