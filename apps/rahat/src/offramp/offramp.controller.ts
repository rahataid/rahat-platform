import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateOfframpProviderDto, CreateOfframpRequestDto, ListOfframpProviderDto, ProviderActionDto } from '@rahataid/extensions';
import { OfframpService } from './offramp.service';

@Controller('offramps')
@ApiTags('Offramps')
export class OfframpController {
  constructor(private readonly offrampService: OfframpService) { }

  @Post('')
  createOfframpRequest(@Body() data: CreateOfframpRequestDto) {
    return this.offrampService.createOfframpRequest(data);
  }

  @Post('/execute')
  executeOfframpRequest(@Body() data: any) {
    return this.offrampService.executeOfframpRequest(data);
  }

  @Post('/providers')
  registerProvider(@Body() data: CreateOfframpProviderDto) {
    return this.offrampService.registerProvider(data);
  }

  @Get('/providers')
  listProviders(@Query() query?: ListOfframpProviderDto) {
    return this.offrampService.listProviders(query);
  }

  @Get('/providers/:uuid')
  getProvidersById(@Param('uuid') uuid: string) {
    return this.offrampService.getProviderById(uuid);
  }

  @Post('/providers/actions')
  providerActions(@Body() data: ProviderActionDto) {
    return this.offrampService.providerActions(data);
  }


  @Get()
  findAllOfframpRequests() {
    return this.offrampService.findAllOfframpRequests();
  }

  @Get('/single')
  findOne(@Query() payload: {
    uuid?: string;
    id?: number;
    requestId?: string;
  }) {
    return this.offrampService.findOne(payload);
  }

  @Get('transactions')
  findAllTransactions(@Body() payload: {
    uuid?: string;
    id?: number;
    requestId?: string;
    status?: string;
    page?: number;
    perPage?: number;
    walletAddress?: string;
  }) {
    return this.offrampService.findAllTransactions(payload);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateOfframpDto: any) {
  //   return this.offrampService.update(+id, updateOfframpDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.offrampService.remove(+id);
  // }
}
