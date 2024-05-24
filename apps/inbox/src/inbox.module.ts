import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [InboxController],
  providers: [
    InboxService,
    {
      provide: 'CORE_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        ClientProxyFactory.create({
          transport: Transport.TCP,
          options: {
            host: configService.get('CORE_SERVICE_HOST'),
            port: configService.get('CORE_SERVICE_PORT'),
          },
        }),
    },
  ],
})
export class ClientModule {}
