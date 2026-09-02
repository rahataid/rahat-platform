// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { BullModule } from "@nestjs/bull";
import { Logger, Module } from "@nestjs/common";
import { BQUEUE } from "@rahataid/sdk";
import { PrismaService } from "@rumsan/prisma";
import { AuthsModule } from "@rumsan/user";
import { HealthController } from "./health.controller";
import { HealthService } from "./health.service";

@Module({
    imports: [
        BullModule.registerQueue({ name: BQUEUE.RAHAT }),
        AuthsModule,
    ],
    controllers: [HealthController],
    providers: [HealthService, PrismaService, Logger],
    exports: [HealthService],
})
export class HealthModule { }
