import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BlockchainVendorDTO } from './dto/blockchain-vendor.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { ListVendorDto } from './dto/list-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { VendorsService } from './vendors.service';

import { JwtAuthGuard } from 'src/auth/guards/jwt.auth.guard';
import { RoleGuard } from 'src/auth/guards/role.guard';

@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RoleGuard)
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

  @Patch(':walletAddress/toogleState')
  changeVendorState(@Param('walletAddress') walletAddress: string) {
    return this.vendorService.changeVendorState(walletAddress);
  }

  @Post('blockchain')
  blockchainCall(@Body() blockchainVendorDTO: BlockchainVendorDTO) {
    return this.vendorService.blockchainCall(blockchainVendorDTO);
  }
}
