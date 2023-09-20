import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from 'src/common/decorators/roles.decorator';
import { ListUserDto } from './dto/list-user.dto';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRoleDto,
} from './dto/user.dto';
import { UsersService } from './users.service';

// @ApiBearerAuth('access-token')
// @UseGuards(JwtAuthGuard, RoleGuard)
@Controller('users')
@ApiTags('Users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [CreateUserDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'List all user' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [CreateUserDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findAll(@Query() query: ListUserDto) {
    return this.usersService.findAll(query);
  }

  @Roles('ADMIN')
  @Get(':id')
  @ApiOperation({ summary: 'Get an user' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [CreateUserDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an user' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [CreateUserDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an user' })
  @ApiResponse({
    status: 200,
    description: 'The found record',
    type: [CreateUserDto],
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }

  @Roles('ADMIN')
  @Patch(':walletAddress/role')
  @ApiOperation({ summary: 'Update user role by wallet address' })
  @ApiResponse({
    status: 200,
    description: 'The updated user with roles',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  updateRole(
    @Param('walletAddress') walletAddress: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateRole(walletAddress, updateUserRoleDto);
  }

  @Roles('ADMIN')
  @Patch(':walletAddress/approve')
  @ApiOperation({ summary: 'Approve a user by wallet address' })
  @ApiResponse({
    status: 200,
    description: 'The approved user',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  approve(@Param('walletAddress') walletAddress: string) {
    return this.usersService.approve(walletAddress);
  }
}
