import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { OutboxModule } from './outbox.module';
import { outboxConfig } from '@app/config';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const transportConfig = outboxConfig().transportConfig;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OutboxModule,
    transportConfig,
  );

  app.useLogger(app.get(PinoLogger));

  app.enableShutdownHooks();

  await app.listen();
}
bootstrap();
