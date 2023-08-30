import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsEmail,
  IsEthereumAddress,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Email of the user',
    example: 'john@doe.com',
  })
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    description: 'Full Name of the user',
    example: 'John Doe',
  })
  name: string;

  @IsEthereumAddress()
  @IsOptional()
  @ApiProperty({
    description: 'Ethereum wallet address of the user',
    example: '0xC67c60cD6d82Fcb2fC6a9a58eA62F80443E32683',
  })
  walletAddress: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'Array of roles associated with the user',
    example: '["USER"]',
  })
  roles: [];
}

export class UpdateUserDto extends PartialType(CreateUserDto) {}
