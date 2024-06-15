import { Module, OnApplicationShutdown } from '@nestjs/common';
import { GptController } from './gpt.controller';
import { GptService } from './gpt.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { gptConfig, outboxConfig } from '@app/config';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [outboxConfig, gptConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { transport, gcpTaskCount, gcpTaskIndex } =
          configService.get('gpt').context;
        return {
          pinoHttp: {
            name: `GptService ${gcpTaskCount ? '(' + transport + ' -Task: ' + gcpTaskIndex + '/' + gcpTaskCount + ')' : '(' + transport + ')'}`,
            transport: configService.get('gpt').pinoTransport,
            level: process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'trace',
          },
        };
      },
    }),
  ],
  controllers: [GptController],
  providers: [
    GptService,
    {
      provide: 'OUTBOX_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('outbox').client,
    },
  ],
})
export class GptModule implements OnApplicationShutdown {
  onApplicationShutdown() {
    console.debug('exiting');
  }
}
