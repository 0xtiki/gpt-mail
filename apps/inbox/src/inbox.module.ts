import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { coreConfig, inboxConfig } from '@app/config';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({ load: [coreConfig, inboxConfig] }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { transport, gcpTaskCount, gcpTaskIndex } =
          configService.get('inbox').context;
        return {
          pinoHttp: {
            name: `InboxService ${gcpTaskCount ? '(' + transport + ' -Task: ' + gcpTaskIndex + '/' + gcpTaskCount + ')' : '(' + transport + ')'}`,
            transport: configService.get('inbox').pinoTransport,
            level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'trace',
          },
        };
      },
    }),
  ],
  controllers: [InboxController],
  providers: [
    InboxService,
    {
      provide: 'CORE_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('core').client,
    },
  ],
})
export class InboxModule {}
