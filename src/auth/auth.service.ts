import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { totp } from 'otplib';

import { MailService } from 'src/mailer/mailer.service';
import { UsersService } from 'src/users/users.service';

import { CreateUserDto } from 'src/users/dto/user.dto';
import { AuthDto } from './dto';
@Injectable()
export class AuthService {
  private readonly _logger = new Logger('Auth Service');
  constructor(
    private jwtService: JwtService,
    private userService: UsersService,
    private mailService: MailService,
  ) {}

  async validateUser(email: string, otp: string): Promise<CreateUserDto> {
    const user = await this.userService.findOneByEmail(email);
    if (
      user &&
      user?.isActive &&
      totp.verify({ token: otp, secret: process.env.OTP_SECRET })
    ) {
      return user;
    }
    throw new NotFoundException('User not found');
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.userService.register(createUserDto);
    if (user) {
      this.mailService.welcome({ email: user?.email, name: user?.name });
      return { success: true, msg: 'User created successfully' };
    }
    throw new BadRequestException('Bad Request');
  }

  async sendOtp(AuthDto: Omit<AuthDto, 'otp'>) {
    this._logger.log(`Sending Login OTP to ${AuthDto?.email}`);
    const { email } = AuthDto;
    const user = await this.userService.findOneByEmail(email);
    if (user && user?.isActive) {
      this._logger.log(`Generating Login OTP to ${AuthDto?.email}`);
      const token = totp.generate(process.env.OTP_SECRET);
      if (token) {
        console.log('otp', token);
        this.mailService.sendOTP({ email: user?.email, otp: token });
        return { success: true, msg: 'OTP sent successfully' };
      }
    }
    throw new NotFoundException('User not found');
  }

  async login(user: any) {
    this._logger.log(`Sending tokens to ${user?.email}`);
    const payload = {
      id: user.id,
      sub: {
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        // role_id: user.role_id,
        roles: user.roles,
      },
    };
    return {
      ...user,
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        expiresIn: +process.env.JWT_EXPIRATION_LONG_TIME,
      }),
    };
  }

  async refreshToken(user: any) {
    this._logger.log(`Generating access token to ${user?.email}`);
    const payload = {
      id: user.id,
      sub: {
        email: user.email,
        name: user.name,
        walletAddress: user.walletAddress,
        // role_id: user.role_id,
        roles: user.roles,
      },
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
