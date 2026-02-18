import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@rumsan/prisma';
import { AbilityModule } from '../ability/ability.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AbilityModule,
  ],
})
export class AppModule { }
