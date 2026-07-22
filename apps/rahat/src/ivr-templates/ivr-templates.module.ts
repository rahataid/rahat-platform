import { Global, Module } from '@nestjs/common';
import { PrismaService } from '@rumsan/prisma';
import { IvrTemplatesController } from './ivr-templates.controller';
import { IvrTemplatesService } from './ivr-templates.service';

@Global()
@Module({
    controllers: [IvrTemplatesController],
    providers: [IvrTemplatesService, PrismaService],
    exports: [IvrTemplatesService],
})
export class IvrTemplatesModule { }

