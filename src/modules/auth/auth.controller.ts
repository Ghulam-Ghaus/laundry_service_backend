import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User successfully logged in' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get details of logged in user' })
  @ApiResponse({ status: 200, description: 'User profile details' })
  async me(@Req() req: any) {
    // req.user is attached by AuthGuard
    return req.user;
  }

  @Post('logout')
  @ApiOperation({ summary: 'Log out current user (Placeholder)' })
  async logout() {
    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset link (Placeholder)' })
  async forgotPassword(@Body('email') email: string) {
    return { message: `Reset email placeholder sent to ${email}` };
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password (Placeholder)' })
  async resetPassword() {
    return { message: 'Password reset placeholder executed' };
  }
}
