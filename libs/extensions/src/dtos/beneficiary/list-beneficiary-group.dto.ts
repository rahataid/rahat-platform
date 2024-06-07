import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class ListBeneficiaryGroupDto {
  @ApiProperty({ example: 'createdAt' })
  @IsString()
  @IsOptional()
  sort: string;

  @ApiProperty({ example: 'asc' })
  @IsString()
  @IsOptional()
  order: 'asc' | 'desc';

  @ApiProperty({ example: 1 })
  @IsNumber()
  page: number;

  @ApiProperty({ example: '10' })
  @IsNumber()
  perPage: number;

  @ApiPropertyOptional({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
  @IsString()
  @IsOptional()
  projectId?: string;
}

// export class ListProjectBeneficiaryDto {

//   @ApiProperty({ example: "ENROLLED" })
//   @IsString()
//   @IsOptional()
//   sort: string;

//   @ApiProperty({ example: "ENROLLED" })
//   @IsString()
//   @IsOptional()
//   order: 'asc' | 'desc';

//   @ApiProperty({ example: 1 })
//   @IsNumber()
//   page: number;

//   @ApiProperty({ example: 10 })
//   @IsNumber()
//   perPage: number;

//   @ApiProperty({ example: "ENROLLED" })
//   @IsString()
//   @IsOptional()
//   status: string;

//   @ApiProperty({ example: "NOT_ASSIGNED" })
//   @IsString()
//   @IsOptional()
//   type: string;

//   @ApiProperty({ example: 'd8f61ebb-ae83-4a8b-8f36-ed756aa27d12' })
//   @IsString()
//   @IsNotEmpty()
//   projectId: string;
// }
