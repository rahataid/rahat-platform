import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateIvrTemplateDto {
    @ApiProperty({
        example: 'Welcome IVR',
        description: 'Name of the IVR template',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'Welcome message for new beneficiaries',
        description: 'Description of the IVR template',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        example: 'https://example.com/flow.json',
        description: 'Flow URL for the IVR template',
    })
    @IsString()
    @IsOptional()
    flowUrl?: string;
}

