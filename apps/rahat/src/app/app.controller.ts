import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateAuthAppDto, ListAuthAppsDto, UpdateAuthAppDto } from '@rahataid/extensions';
import { ACTIONS, APP, SUBJECTS } from '@rahataid/sdk';
import { AbilitiesGuard, CheckAbilities, JwtGuard } from '@rumsan/user';
import { UUID } from 'crypto';
import { AppService } from './app.service';

@Controller('app')
@ApiTags('App')
@ApiBearerAuth(APP.JWT_BEARER)
export class AppController {
  constructor(private readonly appService: AppService) { }

  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Get('auth-apps')
  async listAuthApps(@Query() query: ListAuthAppsDto) {
    return this.appService.listAuthApps(query);
  }

  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Post('auth-apps')
  async createAuthApp(@Body() dto: CreateAuthAppDto) {
    return this.appService.createAuthApps(dto);
  }

  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Get('auth-apps/:uuid')
  @ApiParam({ name: 'uuid', type: 'string' })
  async getAuthApp(@Param('uuid') uuid: UUID) {
    return this.appService.getAuthApp(uuid);
  }

  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Put('auth-apps/:uuid')
  @ApiParam({ name: 'uuid', type: 'string' })
  async updateAuthApp(@Param('uuid') uuid: UUID, @Body() dto: UpdateAuthAppDto) {
    return this.appService.updateAuthApp(uuid, dto);
  }

  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.PUBLIC })
  @Delete('auth-apps/:uuid')
  @ApiParam({ name: 'uuid', type: 'string' })
  async softDeleteAuthApp(@Param('uuid') uuid: UUID) {
    return this.appService.softDeleteAuthApp(uuid);
  }

  @Get('auth-apps/:publicKey/identity')
  @ApiParam({ name: 'publicKey', type: 'string' })
  async getByPublicKey(@Param('publicKey') publicKey: string) {
    return this.appService.getByPublicKey(publicKey);
  }
}
