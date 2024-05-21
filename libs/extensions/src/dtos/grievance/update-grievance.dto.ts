import { ApiProperty } from "@nestjs/swagger";
import { GrievanceStatus } from "@rahataid/sdk";
import { IsEnum } from "class-validator";


export class ChangeGrievanceStatusDTO {
  // @ApiProperty({
  //   example: randomUUID(),
  //   description: 'UUId of the grievance',
  // })
  // @IsUUID()
  // @IsString()
  // uuid: string;

  @ApiProperty({
    example: GrievanceStatus.UNDER_REVIEW,
    description: 'Status of the grievance',
  })
  @IsEnum(GrievanceStatus)
  status: GrievanceStatus;
}
