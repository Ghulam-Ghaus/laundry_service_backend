import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateStaffDto } from './dto/users.dto';

@ApiTags('Customer Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user profile data' })
  async getMe(@Req() req: any) {
    // req.user will be populated by AuthGuard
    const userId = req.user.id;
    return this.usersService.getUserById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Updated profile data' })
  async updateMe(@Req() req: any, @Body() dto: UpdateUserDto) {
    const userId = req.user.id;
    return this.usersService.updateUser(userId, dto);
  }
}

@ApiTags('Admin Users')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users paginated (Admin)' })
  @ApiResponse({ status: 200, description: 'Paginated user list' })
  async getUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.usersService.getAllUsers(parseInt(page, 10), parseInt(limit, 10));
  }

  @Post('staff')
  @ApiOperation({ summary: 'Create staff account (Admin)' })
  @ApiResponse({ status: 201, description: 'Staff user created' })
  async createStaff(@Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user profile by ID (Admin)' })
  @ApiResponse({ status: 200, description: 'User updated' })
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a user' })
  @ApiResponse({ status: 200, description: 'User soft-deleted' })
  async deleteUser(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
    return { message: 'User soft-deleted successfully' };
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore a soft-deleted user' })
  @ApiResponse({ status: 200, description: 'User restored' })
  async restoreUser(@Param('id') id: string) {
    await this.usersService.restoreUser(id);
    return { message: 'User restored successfully' };
  }
}
