import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";



export class ImportBeneficiaryFromToolDTO {
  //   {
  //   groupName: string,
  //     targetUUID: string,
  //       beneficaires: Buffer
  // }

  @ApiProperty({
    type: String,
    description: 'Group Name'
  })
  @IsString()
  @IsOptional()
  groupName: string;

  @ApiProperty({
    type: String,
    description: 'Target UUID'
  })
  @IsString()
  @IsOptional()
  targetUUID: string;

  @ApiProperty({
    type: Buffer,
    description: 'Beneficiaries'
  })
  // TODO: make this required
  // @IsNotEmpty()
  beneficiaries: Buffer;

}


export class ConfirmPendingBeneficiariesDTO {

  @ApiProperty({
    description: 'Beneficiaries',
    example: ['1f3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b', '1f3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b']
  })
  pendingBeneficiaryUUIDs: string[]
}
