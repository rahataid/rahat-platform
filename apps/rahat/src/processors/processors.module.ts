// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from "@nestjs/bull";
import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { BQUEUE } from "@rahataid/sdk";
import { PrismaModule } from "@rumsan/prisma";
import { ImportsModule } from "../imports/imports.module";
import { EmailService } from "../listeners/email.service";
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
        BullModule.registerQueue({ name: BQUEUE.RAHAT_IMPORT }),
        PrismaModule,
        ImportsModule,
    ],
    providers: [RahatProcessor, ProjectProcessor, ImportProcessor, EmailService]
})
export class ProcessorsModule { }
