// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request } from "@nestjs/common";
import { MessagePattern } from "@nestjs/microservices";
import { ApiTags } from "@nestjs/swagger";
import { ChangeGrievanceStatusDTO, CreateGrievanceDTO, ListGrievanceDTO } from "@rahataid/extensions";
import { ACTIONS } from "@rahataid/sdk";
import { CheckAbilities, SUBJECTS } from "@rumsan/user";
import {
  CreateGrievanceMessageDTO,
  DeleteGrievanceMessageDTO
} from "./dto/create-grievance-message.dto";
import { GrievanceService } from "./grievance.service";


@Controller('grievances')
@ApiTags('Grievances')
// @ApiBearerAuth(APP.JWT_BEARER)
// @UseGuards(JwtGuard, AbilitiesGuard)
export class GrievanceController {

  constructor(
    private readonly grievanceService: GrievanceService
  ) { }


  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('')
  // @ApiOkResponse({ type: createGrivenceResponseDTO })
  create(
    @Body() createGrievanceDto: CreateGrievanceDTO,
    @Request() req: { user: { id: number } }
  ) {
    console.log('createGrievanceDtoxxxxxx', createGrievanceDto);
    const userId = req?.user?.id;

    if (!userId) {
      throw new Error('User ID is required');
    }

    return this.grievanceService.createGrievance(createGrievanceDto, userId);
  }


  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })

  @Get('')
  async findAll(
    @Query() query: ListGrievanceDTO
  ) {

    return this.grievanceService.findAll(query);
  }


  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Patch(':uuid/change-status')
  async changeStatus(
    @Param('uuid') uuid: string,
    @Body() data: ChangeGrievanceStatusDTO
  ) {
    return this.grievanceService.changeStatus(uuid, data);
  }

  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Delete(':uuid')
  async softDelete(
    @Param('uuid') uuid: string
  ) {
    return this.grievanceService.softDelete(uuid);
  }


  @MessagePattern({
    cmd: 'rahat.jobs.grievance.created',
  })
  async createProjectGrievance(payload: CreateGrievanceMessageDTO) {
    console.log('createGrievanceDtoxxxxxx', payload);
    const { userId, ...rest } = payload;

    return this.grievanceService.createGrievance(
      rest,
      userId
    );
  }


  @MessagePattern({
    cmd: 'rahat.jobs.grievance.updated',
  })
  updateProjectGrievance(payload: any) {
    console.log('updatedGrievanceDtoxxxxxx', payload);
    return this.grievanceService.updateProjectGrievance(payload.uuid, payload);
  }

  @MessagePattern({
    cmd: 'rahat.jobs.grievance.removed',
  })
  deleteProjectGrievance(payload: DeleteGrievanceMessageDTO) {
    console.log('deleteGrievanceDtoxxxxxx', payload);
    return this.grievanceService.softDelete(payload.uuid);
  }

}
