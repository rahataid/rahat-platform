import { Module } from '@nestjs/common';
import { PrismaModule } from '@rumsan/prisma';
import { OfframpController } from './offramp.controller';
import { OfframpService } from './offramp.service';

@Module({
  imports: [PrismaModule],
  controllers: [OfframpController],
  providers: [OfframpService],
})
export class OfframpModule { }
