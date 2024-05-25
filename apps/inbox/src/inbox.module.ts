import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory } from '@nestjs/microservices';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { coreConfig } from '@app/config';

@Module({
  imports: [ConfigModule.forRoot({ load: [coreConfig] })],
  controllers: [InboxController],
  providers: [
    InboxService,
    {
      provide: 'CORE_SERVICE',
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) =>
        ClientProxyFactory.create(configService.get('core').transportConfig),
    },
  ],
})
export class ClientModule {}
