import { Module } from "@nestjs/common";
import { PrismaModule } from "@rumsan/prisma";
import { GrievanceController } from "./grievance.controller";
import { GrievanceService } from "./grievance.service";


@Module({
  imports: [PrismaModule],
  providers: [GrievanceService],
  controllers: [GrievanceController]
})
export class GrievanceModule { }
