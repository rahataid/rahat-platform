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
import { ChargeBeneficiaryDto } from 'src/beneficiary/dto/update-beneficiary.dto';
import { BlockchainVendorDTO } from './dto/blockchain-vendor.dto';
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

  @Post('blockchain')
  blockchainCall(@Body() blockchainVendorDTO: BlockchainVendorDTO) {
    return this.vendorService.blockchainCall(blockchainVendorDTO);
  }

  @Get('/requestTokenFromBeneficiary')
  requestTokenFromBeneficiary(@Query() query: RequestTokenFromBeneficiaryDto) {
    return this.vendorService.requestTokenFromBeneficiary(query);
  }

  @Get(':walletAddress/processTokenRequest')
  processTokenRequest(@Query() query: ProcessTokenRequest) {
    return this.vendorService.processTokenRequest(query);
  }

  @Post(':walletAddress/chargeBeneficiary')
  chargeBeneficiary(
    @Param('walletAddress') walletAddress: string,
    @Body() payload: ChargeBeneficiaryDto,
  ) {
    return this.vendorService.chargeBeneficiary(walletAddress, payload);
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
