import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { ConfigModule, ConfigService } from '@nestjs/config'; //ConfigService
import { MailerModule } from '@nestjs-modules/mailer';
import mg from 'nodemailer-mailgun-transport';
import { OutboxController } from './outbox.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MailerModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async (configService: ConfigService) => ({
        transport: mg({
          auth: {
            api_key: configService.get('MAILGUN_API_KEY'),
            domain: configService.get('MAILGUN_SENDING_DOMAIN'),
          },
        }),
        defaults: {
          from: `"${configService.get('OUTBOX_EMAIL_TITLE')}" <${configService.get('OUTBOX_EMAIL_USERNAME')}@${configService.get('MAILGUN_SENDING_DOMAIN')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [OutboxController],
  providers: [OutboxService],
})
export class OutboxModule {}
