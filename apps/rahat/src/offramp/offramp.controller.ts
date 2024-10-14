import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateOfframpProviderDto, ListOfframpProviderDto, ProviderActionDto } from '@rahataid/extensions';
import { OfframpService } from './offramp.service';

@Controller('offramps')
@ApiTags('Offramps')
export class OfframpController {
  constructor(private readonly offrampService: OfframpService) { }

  @Post('')
  create(@Body() data: CreateOfframpProviderDto) {
    return this.offrampService.create(data);
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
  findAll() {
    return this.offrampService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.offrampService.findOne(+id);
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