import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateVendorDto } from './dto/create-vendor.dto';
import {
  ListVendorDto,
  ProcessTokenRequest,
  RequestTokenFromBeneficiaryDto,
} from './dto/list-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

@Controller('vendors')
@ApiTags('vendors')
export class VendorsController {
  constructor(private readonly vendorService: VendorsService) {}

  @Post()
  create(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.create(createVendorDto);
  }

  @Get()
  findAll(@Query() query: ListVendorDto) {
    return this.vendorService.findAll(query);
  }

  @Get(':walletAddress')
  findOne(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.findOne(walletAddress);
  }

  @Patch(':walletAddress')
  update(
    @Param('walletAddress') walletAddress: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorService.update(walletAddress, updateVendorDto);
  }

  @Delete(':walletAddress')
  remove(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.remove(walletAddress);
  }

  @Patch(':walletAddress/approval')
  approval(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.approval(walletAddress);
  }

  @Post('register')
  register(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.register(createVendorDto);
  }
  @Patch(':walletAddress/toogleState')
  changeVendorState(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.changeVendorState(walletAddress);
  }

  @Get(':projectId/projectBalance')
  getProjectBalance(@Param('projectId') projectId?: string) {
    return this.vendorService.getProjectBalance(projectId);
  }

  @Get(':walletAddress/checkIsVendorApproved')
  checkIsVendorApproved(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.checkIsVendorApproved(walletAddress);
  }

  @Get(':projectId/checkIsProjectLocked')
  checkIsProjectLocked(@Param('projectId') projectId?: string) {
    return this.vendorService.checkIsProjectLocked(projectId);
  }

  @Get(':walletAddress/pendingTokensToAccept')
  getPendingTokensToAccept(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.getPendingTokensToAccept(walletAddress);
  }

  @Get(':walletAddress/disbursed')
  getDisbursed(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.getDisbursed(walletAddress);
  }

  @Get(':walletAddress/vendorAllowance')
  getVendorAllowance(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.getVendorAllowance(walletAddress);
  }

  @Get(':walletAddress/acceptTokensByVendor')
  acceptTokensByVendor(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.acceptTokensByVendor(walletAddress);
  }

  @Get(':beneficiaryAddress/beneficiaryBalance')
  getBeneficiaryBalance(
    @Param('beneficiaryAddress') beneficiaryAddress: string,
  ) {
    return this.vendorService.getBeneficiaryBalance(beneficiaryAddress);
  }

  @Get('/requestTokenFromBeneficiary')
  requestTokenFromBeneficiary(@Query() query: RequestTokenFromBeneficiaryDto) {
    return this.vendorService.requestTokenFromBeneficiary(query);
  }

  @Get(':walletAddress/processTokenRequest')
  processTokenRequest(@Query() query: ProcessTokenRequest) {
    return this.vendorService.processTokenRequest(query);
  }

  @Get(':walletAddress/chargeBeneficiary')
  chargeBeneficiary(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.chargeBeneficiary(walletAddress);
  }

  @Get(':walletAddress/verifyOtp')
  verifyOtp(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.verifyOtp(walletAddress);
  }

  @Get(':walletAddress/getVendorWalletNonce')
  getVendorWalletNonce(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.getVendorWalletNonce(walletAddress);
  }
}
