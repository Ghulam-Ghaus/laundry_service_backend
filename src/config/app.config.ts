import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env['NODE_ENV'] || 'development',
  port: parseInt(process.env['PORT'] || '4000', 10),
  appName: process.env['APP_NAME'] || 'Awais Dry Cleaner API',
  appUrl: process.env['APP_URL'] || 'http://localhost:4000',
  frontendUrl: process.env['FRONTEND_URL'] || 'http://localhost:3000',
  supabase: {
    url: process.env['SUPABASE_URL'] || '',
    serviceRoleKey: process.env['SUPABASE_SERVICE_ROLE_KEY'] || '',
  },
  jwt: {
    accessSecret: process.env['JWT_ACCESS_SECRET'] || '',
    refreshSecret: process.env['JWT_REFRESH_SECRET'] || '',
    accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] || '15m',
    refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] || '7d',
  },
  defaultLanguage: process.env['DEFAULT_LANGUAGE'] || 'en',
}));
