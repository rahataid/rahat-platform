import { ApiProperty } from "@nestjs/swagger";


export class ConfirmPendingBeneficiariesDTO {

  @ApiProperty({
    description: 'Beneficiaries',
    example: ['1f3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b', '1f3b3b3b-3b3b-3b3b-3b3b-3b3b3b3b3b3b']
  })
  pendingBeneficiaryUUIDs: string[]
}
