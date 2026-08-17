import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckAbilityDTO {
  @IsNumber()
  userId: number;

  @IsString()
  action: string;

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  projectId?: string;

  @IsOptional()
  conditions?: Record<string, unknown>;
}
