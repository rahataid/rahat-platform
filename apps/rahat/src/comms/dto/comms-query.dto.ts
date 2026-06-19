import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DateRangeQueryDto {
  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsString()
  from?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsString()
  to?: string;
}

export class ReportQueryDto {
  @ApiPropertyOptional({ description: 'Cross-reference identifier' })
  @IsOptional()
  @IsString()
  xref?: string;
}
