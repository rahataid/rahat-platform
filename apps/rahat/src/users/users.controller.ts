import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { APP } from '@rahataid/sdk';
import { ListUserDto } from '@rumsan/extensions/dtos';
import {
    AbilitiesGuard,
    ACTIONS,
    CheckAbilities,
    JwtGuard,
    SUBJECTS,
} from '@rumsan/user';
import { UsersService } from './users.service';

@Controller('users')
@ApiTags('Users')
@ApiBearerAuth(APP.JWT_BEARER)
@UseGuards(JwtGuard, AbilitiesGuard)
export class CustomUsersController {
    constructor(private usersService: UsersService) { }

    @Get('wallets')
    @CheckAbilities({ actions: ACTIONS.READ, subject: SUBJECTS.USER })
    getWallets(@Query() dto: ListUserDto) {
        return this.usersService.getWallets(dto);
    }
}