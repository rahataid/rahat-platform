// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy, MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import {
  GetVendorOtp,
  VendorAddToProjectDto,
  VendorRegisterDto,
  VendorUpdateDto,
  VerifyVendorOtp,
} from '@rahataid/extensions';
import { APP, Enums, ProjectContants, TFile, VendorJobs } from '@rahataid/sdk';
import { RequestDetails } from '@rumsan/extensions/decorators';
import { AbilitiesGuard, ACTIONS, CheckAbilities, JwtGuard, SUBJECTS } from '@rumsan/user';
import { UUID } from 'crypto';
import { Address } from 'viem';
import { DocParser } from '../utils/doc-parser';
import { handleMicroserviceCall } from './handleMicroServiceCall.util';
import { VendorsService } from './vendors.service';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorsController {
  constructor(
    @Inject(ProjectContants.ELClient) private readonly client: ClientProxy,
    private readonly vendorService: VendorsService
  ) { }

  @Post('')
  registerVendor(@Body() dto: VendorRegisterDto) {
    return this.vendorService.registerVendor(dto);
  }

  @Get('')
  listVendor(@Query() dto) {
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

  @ApiBearerAuth(APP.JWT_BEARER)
  @UseGuards(JwtGuard, AbilitiesGuard)
  @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: TFile, @Req() req: Request) {
    const docType: Enums.UploadFileType =
      req.body['doctype']?.toUpperCase() || Enums.UploadFileType.JSON;
    const projectId = req.body['projectId'];
    const vendors = await DocParser(docType, file.buffer);

    const mappedVendors = vendors.map((v) => ({
      customerCode: v['Customer code'],
      name: v['Customer name'],
      phone: v['Phone no.'],
      location: v['Region'],
      extras: {
        email: v['Email'],
        channel: v['Channel'],
        lastPurchaseDate: v['Last purchase'],
      }
    }))

    return handleMicroserviceCall({
      client: this.client.send(
        { cmd: VendorJobs.IMPORT, uuid: projectId },
        mappedVendors
      ),
      onSuccess(res) {
        console.log('Vendors imported successfully:', res);
        return res;
      },
      onError(err) {
        console.error('Error importing vendors:', err);
        throw new RpcException(err.message || 'Failed to import vendors')
      }
    })


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
  getVendorStats(@Payload() dto) {
    return this.vendorService.getVendorClaimStats(dto);
  }

  @MessagePattern({ cmd: VendorJobs.GET_BY_UUID })
  getVenderByUuid(@Payload() dto) {
    return this.vendorService.getVendorByUuid(dto);
  }
}
