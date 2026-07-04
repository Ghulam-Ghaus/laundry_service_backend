import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SupabaseClientService } from '../../database/supabase.client';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { UsersQueries } from '../users/queries/users.queries';
import { RbacQueries } from '../rbac/queries/rbac.queries';
import { LookupsQueries } from '../lookups/queries/lookups.queries';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

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

    // 3. Register user in Supabase Auth
    const { data: signUpData, error: signUpError } = await this.supabase.client.auth.signUp({
      email: dto.email,
      password: dto.password,
    });

    if (signUpError || !signUpData.user) {
      throw new BadRequestException(`Auth signup failed: ${signUpError?.message || 'Unknown error'}`);
    }

    const authUserId = signUpData.user.id;

    // 4. Create mirror user in database
    try {
      const appUser = await this.usersQueries.createUser({
        auth_user_id: authUserId,
        email: dto.email,
        phone: dto.phone || null,
        first_name: dto.firstName,
        last_name: dto.lastName || null,
        avatar_url: null,
        preferred_language_id: langId,
        default_role_id: customerRole.id,
      });

      // Assign customer role in user_roles
      await this.rbacQueries.assignRoleToUser(appUser.id, customerRole.id);

      return this.generateTokens(appUser.id, appUser.email, ['customer'], ['orders.read', 'orders.create', 'orders.cancel', 'catalog.read', 'areas.read', 'slots.read']);
    } catch (err: any) {
      // Clean up Auth account if database mirror fails
      await this.supabase.client.auth.admin.deleteUser(authUserId);
      throw new BadRequestException(`Failed to register user mirror: ${err.message}`);
    }
  }

  async login(dto: LoginDto) {
    // 1. Sign in with Supabase Auth to check password
    const { data: signInData, error: signInError } = await this.supabase.client.auth.signInWithPassword({
      email: dto.email,
      password: dto.password,
    });

    if (signInError || !signInData.user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const authUserId = signInData.user.id;

    // 2. Fetch mirror user
    const appUser = await this.usersQueries.findByAuthId(authUserId);
    if (!appUser) {
      throw new UnauthorizedException('User mirror record not found');
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
