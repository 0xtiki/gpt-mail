import { Module, OnApplicationShutdown } from '@nestjs/common';
import { OutboxService } from './outbox.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { OutboxController } from './outbox.controller';
import { outboxConfig } from '@app/config';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [outboxConfig] }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { transport, gcpTaskCount, gcpTaskIndex } =
          configService.get('outbox').context;
        return {
          pinoHttp: {
            name: `OutboxService ${gcpTaskCount ? '(' + transport + ' -Task: ' + gcpTaskIndex + '/' + gcpTaskCount + ')' : '(' + transport + ')'}`,
            transport: configService.get('outbox').pinoTransport,
            level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'trace',
          },
        };
      },
    }),
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
export class OutboxModule implements OnApplicationShutdown {
  onApplicationShutdown() {
    console.debug('exiting');
  }
}
