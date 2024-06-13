import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { coreConfig, gptConfig } from '@app/config';
import { HttpModule } from '@nestjs/axios';
import { LoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [gptConfig, coreConfig],
    }),
    LoggerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const { transport, gcpTaskCount, gcpTaskIndex } =
          configService.get('core').context;
        return {
          pinoHttp: {
            name: `CoreService ${gcpTaskCount ? '(' + transport + ' -Task: ' + gcpTaskIndex + '/' + gcpTaskCount + ')' : '(' + transport + ')'}`,
            transport: configService.get('core').pinoTransport,
          },
        };
      },
    }),
    HttpModule,
  ],
  controllers: [CoreController],
  providers: [
    CoreService,
    {
      provide: 'GPT_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        configService.get('gpt').client,
    },
  ],
})
export class CoreModule {}
