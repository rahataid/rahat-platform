import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTokenDto } from '@rahataid/extensions';
import { TokenService } from './token.service';

@Controller('token')
@ApiTags('Tokens')
export class TokenController {
  constructor(private readonly tokenService: TokenService) { }

  @Post()
  create(@Body() createTokenDto: CreateTokenDto) {
    return this.tokenService.create(createTokenDto);
  }

  @Get()
  findAll() {
    return this.tokenService.findAll();
  }

  @Get(':contractAddress')
  findOne(@Param('contractAddress') contractAddress: string) {
    return this.tokenService.findOne(contractAddress);
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateTokenDto: UpdateTokenDto) {
  //   return this.tokenService.update(+id, updateTokenDto);
  // }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tokenService.remove(+id);
  }
}
