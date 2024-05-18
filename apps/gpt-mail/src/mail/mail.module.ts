import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import mg from 'nodemailer-mailgun-transport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GptModule } from '../gpt/gpt.module';

@Module({
  imports: [
    GptModule,
    ConfigModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        transport: mg({
          auth: {
            api_key: configService.get('MAILGUN_API_KEY'),
            domain: configService.get('MAILGUN_SENDING_DOMAIN'),
          },
        }),
        defaults: {
          from: `"gptMail" <${configService.get('GPT_MAIL_ASSISTANT_USERNAME')}@${configService.get('MAILGUN_SENDING_DOMAIN')}>`,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
