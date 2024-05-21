import { Body, Controller, Get, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { CreateGrievanceDTO, ListGrievanceDTO } from "@rahataid/extensions";
import { ACTIONS, APP } from "@rahataid/sdk";
import { AbilitiesGuard, CheckAbilities, JwtGuard, SUBJECTS } from "@rumsan/user";
import { GrievanceService } from "./grievance.service";


@Controller('grievances')
@ApiTags('Grievances')
@ApiBearerAuth(APP.JWT_BEARER)
@UseGuards(JwtGuard, AbilitiesGuard)
export class GrievanceController {

  constructor(
    private readonly grievanceService: GrievanceService
  ) { }


  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })

  @Post('')
  create(
    @Body() createGrievanceDto: CreateGrievanceDTO,
    @Request() req: any

  ) {
    const id = req.user.id;
    console.log('req.user', req.user)
    return this.grievanceService.createGrievance(createGrievanceDto, id)
  }

  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })

  @Get('')
  async findAll(
    @Query() query: ListGrievanceDTO
  ) {

    return this.grievanceService.findAll(query);
  }


}
