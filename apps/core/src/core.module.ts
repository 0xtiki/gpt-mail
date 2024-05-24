import { Module } from '@nestjs/common';
import { CoreController } from './core.controller';
import { CoreService } from './core.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [CoreController],
  providers: [
    CoreService,
    {
      provide: 'GPT_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: configService.get('GPT_SERVICE_HOST'),
            port: configService.get('GPT_SERVICE_PORT'),
          },
        }),
    },
    {
      provide: 'OUTBOX_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: configService.get('OUTBOX_SERVICE_HOST'),
            port: configService.get('OUTBOX_SERVICE_PORT'),
          },
        }),
    },
  ],
})
export class CoreModule {}
