import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseClientService } from '../../database/supabase.client';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UsersQueries } from '../users/queries/users.queries';
import { RbacQueries } from '../rbac/queries/rbac.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseClientService,
    private readonly usersQueries: UsersQueries,
    private readonly rbacQueries: RbacQueries,
    private readonly lookupsQueries: LookupsQueries,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Check if email already in app_users
    const existingUser = await this.usersQueries.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    // 2. Resolve preferred language ID
    let langId: string | null = null;
    if (dto.preferredLanguageCode) {
      const langLookup = await this.lookupsQueries.findValueByCode('language', dto.preferredLanguageCode);
      if (langLookup) {
        langId = langLookup.id;
      }
    }

    // Resolve default customer role
    const customerRole = await this.rbacQueries.findRoleByCode('customer');
    if (!customerRole) {
      throw new BadRequestException('Default customer role not found in database');
    }

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 4. Create user in database with password hash
    try {
      const appUser = await this.usersQueries.createUser({
        auth_user_id: null,
        email: dto.email,
        phone: dto.phone || null,
        first_name: dto.firstName,
        last_name: dto.lastName || null,
        avatar_url: null,
        preferred_language_id: langId,
        default_role_id: customerRole.id,
        password_hash: hashedPassword,
      });

      // Assign customer role in user_roles
      await this.rbacQueries.assignRoleToUser(appUser.id, customerRole.id);

      return this.generateTokens(appUser.id, appUser.email, ['customer'], ['orders.read', 'orders.create', 'orders.cancel', 'catalog.read', 'areas.read', 'slots.read']);
    } catch (err: any) {
      throw new BadRequestException(`Failed to register user: ${err.message}`);
    }
  }

  async login(dto: LoginDto) {
    // 1. Fetch user by email
    const appUser = await this.usersQueries.findByEmail(dto.email);
    if (!appUser || !appUser.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // 2. Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, appUser.password_hash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!appUser.is_active) {
      throw new UnauthorizedException('Account has been deactivated');
    }

    // Update last login timestamp asynchronously
    this.usersQueries.updateUser(appUser.id, { last_login_at: new Date().toISOString() }).catch(() => {});

    // 3. Fetch roles and permissions
    const roles = await this.rbacQueries.findRolesForUser(appUser.id);
    const permissions = await this.rbacQueries.findPermissionsForUser(appUser.id);

    return this.generateTokens(appUser.id, appUser.email, roles, permissions);
  }

  async getProfile(userId: string) {
    const user = await this.usersQueries.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const roles = await this.rbacQueries.findRolesForUser(userId);
    const permissions = await this.rbacQueries.findPermissionsForUser(userId);

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      first_name: user.first_name,
      last_name: user.last_name,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      roles,
      permissions,
    };
  }

  private async generateTokens(userId: string, email: string, roles: string[], permissions: string[]) {
    const payload = {
      sub: userId,
      email,
      roles,
      permissions,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('app.jwt.accessSecret'),
      expiresIn: this.configService.get<string>('app.jwt.accessExpiresIn') as any,
    });

    const refreshToken = await this.jwtService.signAsync(
      { sub: userId },
      {
        secret: this.configService.get<string>('app.jwt.refreshSecret'),
        expiresIn: this.configService.get<string>('app.jwt.refreshExpiresIn') as any,
      },
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: userId,
        email,
        roles,
        permissions,
      },
    };
  }
}
