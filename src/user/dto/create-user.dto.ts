import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Rahat User',
    description: 'Rahat User name',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    example: 'user@mailinator.com',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  // @ApiProperty({
  //   required: false,
  //   maxLength: 10,
  //   minLength: 10,
  //   example: '9865430408',
  // })
  // @IsString()
  // @IsOptional()
  // phone?: string;

  @ApiProperty({
    example: '0xac0C1207D054a64FFc68830b0db2e17Fc1e93766',
    description: 'User Wallet Address',
  })
  @IsString()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({})
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({
    example: 'User',
  })
  @IsString()
  @IsOptional()
  role?: string;
}
