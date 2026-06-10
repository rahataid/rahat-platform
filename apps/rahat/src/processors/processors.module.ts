// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { BQUEUE } from "@rahataid/sdk";
import { PrismaModule } from "@rumsan/prisma";
import { ImportsModule } from "../imports/imports.module";
import { EmailService } from "../listeners/email.service";
import { WalletModule } from "../wallet/wallet.module";
import { GroupProjectSyncProcessor } from "./group-project-sync.processor";
import { ImportProcessor } from "./import.processor";
import { ProjectProcessor } from "./project.processor";
import { RahatProcessor } from "./rahat.processor";

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'DEPLOYMENT_CLIENT',
                transport: Transport.REDIS,
                options: {
                    host: process.env.REDIS_HOST,
                    port: +process.env.REDIS_PORT,
                    password: process.env.REDIS_PASSWORD,
                },
            },
        ]),
        ClientsModule.registerAsync([
            {
                name: 'RAHAT_CLIENT',
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.REDIS,
                    options: {
                        host: configService.get('REDIS_HOST'),
                        port: configService.get('REDIS_PORT'),
                        password: configService.get('REDIS_PASSWORD'),
                    },
                }),
                inject: [ConfigService],
            },
        ]),
        BullModule.registerQueue({ name: BQUEUE.RAHAT_IMPORT }),
        BullModule.registerQueue({ name: BQUEUE.RAHAT_BENEFICIARY }),
        PrismaModule,
        ImportsModule,
        WalletModule,
    ],
    providers: [RahatProcessor, ProjectProcessor, ImportProcessor, GroupProjectSyncProcessor, EmailService]
})
export class ProcessorsModule { }
