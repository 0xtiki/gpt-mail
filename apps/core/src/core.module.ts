import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { gptConfig, outboxConfig } from '@app/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [gptConfig, outboxConfig],
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
        ClientProxyFactory.create(configService.get('gpt').transportConfig),
    },
    {
      provide: 'OUTBOX_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        ClientProxyFactory.create(configService.get('outbox').transportConfig),
    },
  ],
})
export class CoreModule {}
