import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { SharedAuthJobs } from '@rahataid/sdk';
import { EVENTS } from '@rahataid/sdk/shared-auth/shared-auth.event';
import { AbilityService } from './ability.service';
import { CheckAbilityDTO } from './dto/checkAbility.dto';

@Controller()
export class AbilityController {
    constructor(private readonly abilityService: AbilityService) { }

    @MessagePattern({ cmd: SharedAuthJobs.CHECK_ABILITY })
    checkAbility(@Payload() payload: CheckAbilityDTO) {
        return this.abilityService.checkAbility(payload);
    }

    @EventPattern(EVENTS.INVALIDATE_ABILITY_CACHE)
    invalidateCache(@Payload() payload: { userId: number; xrefId?: string }) {
        return this.abilityService.invalidateCache(
            payload.userId,
            payload.xrefId
        );
    }

    @EventPattern(EVENTS.INVALIDATE_ABILITY_CACHE_BY_ROLE)
    invalidateCacheByRole(@Payload() payload: { roleName: string }) {
        return this.abilityService.invalidateCacheByRole(payload.roleName)
    }

}
