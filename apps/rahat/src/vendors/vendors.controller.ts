// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  GetVendorOtp,
  VendorAddToProjectDto,
  VendorPasswordRegisterDto,
  VendorRegisterDto,
  VendorUpdateDto,
  VerifyVendorOtp,
} from '@rahataid/extensions';
import { APP, VendorJobs } from '@rahataid/sdk';
import { Request } from '@rumsan/sdk/types';

import { RequestDetails } from '@rumsan/extensions/decorators';
import { ChangePasswordDto, PasswordLoginDto } from '@rumsan/extensions/dtos';
import { CurrentUserInterface, JwtGuard } from '@rumsan/user';
import { CurrentUser } from '@rumsan/user/lib/auths/decorator/current-user.decorator';
import { UUID } from 'crypto';
import { Address } from 'viem';
import { GetVendorsDTO } from './dto/get-vendors.dto';
import { VendorsService } from './vendors.service';


@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(private readonly vendorService: VendorsService) { }

  @Post('')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.vendorService.registerVendor(dto);
  }

  @Get('')
  listVendor(@Query() dto: GetVendorsDTO) {
    return this.vendorService.listVendor(dto);
  }

  @MessagePattern({ cmd: VendorJobs.LIST_BY_PROJECT })
  listByProject(dto) {
    return this.vendorService.listProjectVendor(dto);
  }

  @Get('/stats')
  getVendorCount(@Query() dto) {
    return this.vendorService.getVendorCount();
  }

  @ApiParam({ name: 'id', required: true })
  @Get('/:id')
  getVendor(@Param('id') id: UUID | Address,
  ) {
    return this.vendorService.getVendor(id,);
  }

  @Post('/getOtp')
  getOtp(@Body() dto: GetVendorOtp, @RequestDetails() rdetails: any) {
    return this.vendorService.getOtp(dto, rdetails);
  }

  @Post('/verifyOtp')
  verifyOtp(@Body() dto: VerifyVendorOtp, @RequestDetails() rdetails: any) {
    return this.vendorService.verifyOtp(dto, rdetails);
  }

  @ApiParam({ name: 'uuid', required: true })
  @Patch('/update/:uuid')
  updateVendor(@Param('uuid') uuid: UUID, @Body() dto: VendorUpdateDto) {
    return this.vendorService.updateVendor(dto, uuid);
  }

  // @ApiBearerAuth(APP.JWT_BEARER)
  // @UseGuards(JwtGuard, AbilitiesGuard)
  @Patch('remove/:vendorId')
  @ApiParam({ name: 'vendorId', required: true })
  async removeVendor(
    @Param('vendorId') vendorId: UUID,
    @Body('projectId') projectId?: UUID
  ) {
    return this.vendorService.removeVendor(vendorId, projectId);
  }

  ///microservice
  @MessagePattern({ cmd: VendorJobs.GET_REDEMPTION_VENDORS })
  listRedemptionVendors(data) {
    return this.vendorService.listRedemptionVendor(data);
  }

  @MessagePattern({ cmd: VendorJobs.ASSIGN_PROJECT })
  assignToProject(@Payload() dto: VendorAddToProjectDto) {
    return this.vendorService.assignToProject(dto);
  }

  @MessagePattern({ cmd: VendorJobs.GET_VENDOR_STATS })
  getVendorStats(@Payload() dto: any) {
    return this.vendorService.getVendorClaimStats(dto);
  }

  @MessagePattern({ cmd: VendorJobs.GET_BY_UUID })
  getVenderByUuid(@Payload() dto: any) {
    return this.vendorService.getVendorByUuid(dto);
  }

  @Post('password-register')
  passwordRegister(
    @Body() dto: VendorPasswordRegisterDto,
    @RequestDetails() rdetails: Request
  ) {
    return this.vendorService.registerVendorWithPassword(dto, rdetails);
  }

  @Post('password-login')
  passwordLogin(
    @Body() dto: PasswordLoginDto,
    @RequestDetails() rdetails: Request
  ) {
    return this.vendorService.loginByPassword(dto, rdetails);
  }

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard)
  @Post('password-change')
  passwordChange(
    @CurrentUser() user: CurrentUserInterface,
    @Body() dto: ChangePasswordDto
  ) {
    return this.vendorService.changeVendorPassword(user, dto);
  }
}
