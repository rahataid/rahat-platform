import { Body, Controller, Post, Request, UseGuards } from '@nestjs/common';
import { totp } from 'otplib';

import { AuthService } from './auth.service';

import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateUserDto } from 'src/users/dto/user.dto';
import { AuthDto } from './dto';

import { Public } from 'src/common/decorators/public.decorator';
import { LocalAuthGuard } from './guards/local.auth.guard';
import { RefreshJWTGuard } from './guards/refresh.auth.guard';

import { ResponseMessage, Tokens } from './types';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private authService: AuthService) {
    totp.options = {
      step: +process.env.OTP_DURATION_IN_SECS,
    };
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req): Promise<CreateUserDto & Tokens> {
    return await this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register User' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [CreateUserDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  register(
    @Body() createUserDto: CreateUserDto,
  ): Promise<ResponseMessage | null> {
    return this.authService.register(createUserDto);
  }

  @Public()
  @Post('send-otp')
  async sendOtp(@Body() AuthDto: AuthDto): Promise<ResponseMessage | null> {
    return this.authService.sendOtp(AuthDto);
  }

  @Public()
  @UseGuards(RefreshJWTGuard)
  @Post('refresh')
  @ApiOperation({ summary: 'Get new access token using refresh token' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [CreateUserDto],
  })
  async refresh(@Request() req): Promise<Omit<Tokens, 'refresh_token'>> {
    return this.authService.refreshToken(req.user);
  }
}
