import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { UsersQueries, DbUser } from './queries/users.queries';
import { UpdateUserDto, CreateStaffDto } from './dto/users.dto';
import { RbacQueries } from '../rbac/queries/rbac.queries';
import { SupabaseClientService } from '../../database/supabase.client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersQueries: UsersQueries,
    private readonly rbacQueries: RbacQueries,
    private readonly supabase: SupabaseClientService,
  ) {}

  async getUserById(id: string): Promise<DbUser> {
    const user = await this.usersQueries.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUser(id: string, dto: UpdateUserDto): Promise<DbUser> {
    return this.usersQueries.updateUser(id, {
      first_name: dto.firstName,
      last_name: dto.lastName,
      phone: dto.phone,
      preferred_language_id: dto.preferredLanguageId,
      avatar_url: dto.avatarUrl,
    });
  }

  async getAllUsers(page: number, limit: number) {
    const result = await this.usersQueries.findAllUsers(page, limit);
    return {
      items: result.items,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: Math.ceil(result.total / limit),
      },
    };
  }

  async deleteUser(id: string): Promise<void> {
    await this.usersQueries.deleteUser(id);
  }

  async restoreUser(id: string): Promise<void> {
    await this.usersQueries.restoreUser(id);
  }

  async createStaff(dto: CreateStaffDto): Promise<DbUser> {
    // 1. Check if user already exists
    const existing = await this.usersQueries.findByEmail(dto.email);
    if (existing) {
      throw new BadRequestException('User with this email already exists');
    }

    // 2. Validate role
    const role = await this.rbacQueries.findRoleByCode(dto.roleCode);
    if (!role) {
      throw new BadRequestException(`Role ${dto.roleCode} does not exist`);
    }

    // 3. Hash temporary password
    const tempPassword = 'TempPassword123!';
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // 4. Create user record in database
    try {
      const appUser = await this.usersQueries.createUser({
        auth_user_id: null,
        email: dto.email,
        phone: dto.phone || null,
        first_name: dto.firstName,
        last_name: dto.lastName || null,
        avatar_url: null,
        preferred_language_id: null,
        default_role_id: role.id,
        password_hash: passwordHash,
      });

      // 5. Link role in user_roles
      await this.rbacQueries.assignRoleToUser(appUser.id, role.id);

      return appUser;
    } catch (dbError: any) {
      throw new BadRequestException(`Failed to create user record: ${dbError.message}`);
    }
  }
}
