import { PartialType } from '@nestjs/swagger';
import { CreateIvrTemplateDto } from './create-ivr-template.dto';

export class UpdateIvrTemplateDto extends PartialType(CreateIvrTemplateDto) { }

