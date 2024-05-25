import { Module } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { OutboxController } from './outbox.controller';
import { outboxConfig } from '@app/config';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [outboxConfig] }),
    MailerModule.forRootAsync({
      imports: [ConfigModule.forRoot()],
      useFactory: async (configService: ConfigService) =>
        configService.get('outbox').emailProviderConfig,
      inject: [ConfigService],
    }),
  ],
  controllers: [OutboxController],
  providers: [OutboxService],
})
export class OutboxModule {}
