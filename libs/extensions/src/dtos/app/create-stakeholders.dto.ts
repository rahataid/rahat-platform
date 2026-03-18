import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length
} from 'class-validator';

export class CreateStakeholderDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;


  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @Length(7, 20, { message: 'Phone number must be between 7 and 20 characters' })
  phone: string;

  @IsString()
  @IsOptional()
  designation: string;

  @IsString()
  @IsOptional()
  organization: string;

  @IsString()
  @IsOptional()
  district: string;

  @IsString()
  @IsOptional()
  municipality: string;
}
