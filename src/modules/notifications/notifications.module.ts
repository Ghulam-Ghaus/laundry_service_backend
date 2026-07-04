import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { NotificationsQueries } from './queries/notifications.queries';
import { LookupsModule } from '../lookups/lookups.module';
import { EmailAdapter } from './adapters/email.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { WhatsappAdapter } from './adapters/whatsapp.adapter';

@Module({
  imports: [LookupsModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsQueries,
    EmailAdapter,
    SmsAdapter,
    WhatsappAdapter,
  ],
  exports: [NotificationsService, NotificationsQueries],
})
export class NotificationsModule {}
