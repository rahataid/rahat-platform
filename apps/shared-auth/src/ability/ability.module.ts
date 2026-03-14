import { Module } from '@nestjs/common';
import { PrismaModule } from '@rumsan/prisma';
import { AbilityController } from './ability.controller';
import { AbilityService } from './ability.service';

@Module({
  imports: [PrismaModule],
  controllers: [AbilityController],
  providers: [AbilityService],
})
export class AbilityModule { }
