import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseClientService {
  private readonly logger = new Logger(SupabaseClientService.name);
  public readonly client: SupabaseClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('app.supabase.url');
    const serviceRoleKey = this.configService.get<string>('app.supabase.serviceRoleKey');

    if (!url || !serviceRoleKey) {
      this.logger.error('Supabase URL or Service Role Key is missing!');
      throw new Error('Supabase configuration is invalid');
    }

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    this.logger.log('Supabase Client initialized successfully.');
  }
}
