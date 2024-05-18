import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ClientController } from './client.controller';
import { RouteController } from './route.controller';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [ClientController, RouteController],
  providers: [
    {
      provide: 'GPT_MAIL_SERVICE',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: configService.get('GPT_MAIL_SERVICE_HOST'),
            port: configService.get('GPT_MAIL_SERVICE_PORT'),
          },
        }),
    },
  ],
})
export class ClientModule {}
