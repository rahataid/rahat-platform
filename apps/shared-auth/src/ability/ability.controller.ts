import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { SharedAuthJobs } from '@rahataid/sdk';
import { AbilityService } from './ability.service';
import { CheckAbilityDTO } from './dto/checkAbility.dto';

@Controller()
export class AbilityController {
  constructor(private readonly abilityService: AbilityService) {}

  @MessagePattern({ cmd: SharedAuthJobs.CHECK_ABILITY })
  checkAbility(@Payload() payload: CheckAbilityDTO) {
    return this.abilityService.checkAbility(payload);
  }

  @MessagePattern({ cmd: SharedAuthJobs.INVALIDATE_ABILITY_CACHE })
  invalidateCache(@Payload() payload: { userId: number; projectId?: string }) {
    return this.abilityService.invalidateCache(
      payload.userId,
      payload.projectId
    );
  }
}
