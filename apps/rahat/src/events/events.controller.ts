import { Controller, Sse, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { APP } from '@rahataid/sdk';
import { AbilitiesGuard, ACTIONS, CheckAbilities, JwtGuard, SUBJECTS } from '@rumsan/user';
import { EventsService } from './events.service';

@Controller('events')
@ApiTags('Events')
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Sse('phases')
  phases() {
    return this.events.phases();
  }
}
