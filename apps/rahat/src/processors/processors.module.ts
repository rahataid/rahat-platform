// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { BQUEUE } from "@rahataid/sdk";
import { SettingsModule } from "@rumsan/extensions/settings";
import { PrismaModule } from "@rumsan/prisma";
import { ImportsModule } from "../imports/imports.module";
import { EmailService } from "../listeners/email.service";
import { WalletModule } from "../wallet/wallet.module";
import { ImportProcessor } from "./import.processor";
import { ProjectProcessor } from "./project.processor";
import { RahatProcessor } from "./rahat.processor";
import { WalletProcessor } from "./wallet.processor";

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
        BullModule.registerQueue({ name: BQUEUE.RAHAT_IMPORT }),
        BullModule.registerQueue({ name: BQUEUE.FUND_VENDOR_WALLET }),
        PrismaModule,
        ImportsModule,
        WalletModule,
        SettingsModule,
    ],
    providers: [RahatProcessor, ProjectProcessor, ImportProcessor, EmailService, WalletProcessor],
})
export class ProcessorsModule { }
