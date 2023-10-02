import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional } from 'class-validator';

export class AuthDto {
  @ApiProperty({
    example: 'email@email.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: '123456',
  })
  @IsOptional()
  @IsString()
  otp: string;
}
