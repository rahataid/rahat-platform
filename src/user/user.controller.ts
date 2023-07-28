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
import { CreateUserDto } from './dto/create-user.dto';
import { ListUserDto } from './dto/list-user.dto';
import { RequestUserOtpDto, VerifyUserOtpDto } from './dto/login-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserService } from './user.service';

@Controller('users')
@ApiTags('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('register')
  register(@Body() registerUserData: CreateUserDto) {
    return this.userService.register(registerUserData);
  }

  @Get()
  // @CheckAbilities(new ReadUserAbility())
  findAll(@Query() query: ListUserDto) {
    return this.userService.findAll(query);
  }

  @Get(':walletAddress')
  // @CheckAbilities(new ReadUserAbility())
  findOne(@Param('walletAddress') walletAddress: string) {
    return this.userService.findOne(walletAddress);
  }

  @Patch(':id')
  // @CheckAbilities({ action: Action.UPDATE, subject: User })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    // Pull user data from DB before executing the CASL check
    return this.userService.update(+id, updateUserDto);
  }

  @Delete(':id')
  // @CheckAbilities({ action: Action.DELETE, subject: User })
  remove(@Param('id') id: string) {
    return this.userService.remove(+id);
  }

  @Patch(':walletAddress/approve')
  approve(@Param('walletAddress') walletAddress: string) {
    return this.userService.approve(walletAddress);
  }

  @Post('login/otp')
  requestOtp(@Body() requestOtpDto: RequestUserOtpDto) {
    return this.userService.requestOtp(requestOtpDto);
  }

  @Post('login/verify-otp')
  verifyOtp(@Body() verifyOtpDto: VerifyUserOtpDto) {
    return this.userService.verifyOtp(verifyOtpDto);
  }
}
