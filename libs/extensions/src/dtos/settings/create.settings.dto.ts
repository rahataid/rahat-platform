import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export enum SettingDatatypeENUM {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  OBJECT = 'OBJECT',
}

export class CreateSettingDto {
  constructor() {
    this.name = '';
    this.value = {};
    this.dataType = SettingDatatypeENUM.STRING;
  }
  @ApiProperty({
    example: 'SMTP',
    description: 'Name of the setting',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  dataType: SettingDatatypeENUM;

  @ApiProperty({
    example: {
      host: 'smtp.gmail.com',
      Port: 465,
      secure: true,
      username: 'test',
      password: 'test',
    },
    description: 'Settings value. Can be string | number | boolean | object',
    required: true,
  })
  @IsNotEmpty()
  value: string | number | boolean | object;

  @ApiProperty({
    example: ['host', 'port', 'secure', 'username', 'PASSWORD'],
    description: 'Settings value. Can be string | number | boolean | object',
    required: true,
  })
  @IsOptional()
  @IsArray()
  requiredFields?: string[];

  @ApiProperty({
    example: false,
    description: 'If true, setting value cannot be changed',
  })
  @IsOptional()
  @IsBoolean()
  isReadOnly?: boolean;

  @ApiProperty({
    example: true,
    description: 'If true, setting value is not returned in public API',
  })
  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;
}
