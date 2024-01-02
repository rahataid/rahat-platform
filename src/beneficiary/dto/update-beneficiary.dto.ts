import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsString } from 'class-validator';
import { CreateBeneficiaryDto } from './create-beneficiary.dto';

export class UpdateBeneficiaryDto extends PartialType(CreateBeneficiaryDto) {}

export class UpdateBeneficiaryStatusDto {
  @ApiProperty({
    example: true,
  })
  @IsBoolean()
  isApproved: boolean;
}

export class AssignBeneficiaryToProjectDto {
  @ApiProperty({
    example: '2',
  })
  @IsString()
  projectId: string;
}

export class DisableBeneficiaryDto {
  @ApiProperty({
    example: '0x123',
  })
  walletAddress: string;
}

export class ChargeBeneficiaryDto {
  @ApiProperty({
    example: '10',
  })
  @IsString()
  amount: string;

  @ApiProperty({
    example: '9860243992',
  })
  @IsString()
  phone: string;
}
