import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiTags } from '@nestjs/swagger';
import { CreateIvrTemplateDto, UpdateIvrTemplateDto } from '@rahataid/extensions';
import { APP } from '@rahataid/sdk';
import {
    AbilitiesGuard,
    ACTIONS,
    CheckAbilities,
    JwtGuard,
    SUBJECTS,
} from '@rumsan/user';
import { IvrTemplatesService } from './ivr-templates.service';

@ApiTags('IVR Templates')
@Controller('ivr-templates')
export class IvrTemplatesController {
    constructor(private readonly ivrTemplatesService: IvrTemplatesService) { }

    @ApiBearerAuth(APP.JWT_BEARER)
    @UseGuards(JwtGuard, AbilitiesGuard)
    @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.USER })
    @Post()
    create(@Body() dto: CreateIvrTemplateDto) {
        return this.ivrTemplatesService.create(dto);
    }

    @ApiBearerAuth(APP.JWT_BEARER)
    @UseGuards(JwtGuard, AbilitiesGuard)
    @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
    @Get()
    findAll() {
        return this.ivrTemplatesService.findAll();
    }

    @ApiBearerAuth(APP.JWT_BEARER)
    @UseGuards(JwtGuard, AbilitiesGuard)
    @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
    @Get(':id')
    @ApiParam({ name: 'id', required: true, type: Number })
    findOne(@Param('id') id: string) {
        return this.ivrTemplatesService.findOne(+id);
    }

    @ApiBearerAuth(APP.JWT_BEARER)
    @UseGuards(JwtGuard, AbilitiesGuard)
    @CheckAbilities({ actions: ACTIONS.UPDATE, subject: SUBJECTS.USER })
    @Patch(':id')
    @ApiParam({ name: 'id', required: true, type: Number })
    update(@Param('id') id: string, @Body() dto: UpdateIvrTemplateDto) {
        return this.ivrTemplatesService.update(+id, dto);
    }

    @ApiBearerAuth(APP.JWT_BEARER)
    @UseGuards(JwtGuard, AbilitiesGuard)
    @CheckAbilities({ actions: ACTIONS.MANAGE, subject: SUBJECTS.USER })
    @Delete(':id')
    @ApiParam({ name: 'id', required: true, type: Number })
    remove(@Param('id') id: string) {
        return this.ivrTemplatesService.remove(+id);
    }
}

