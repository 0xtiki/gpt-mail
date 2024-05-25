import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { OutboxModule } from './outbox.module';
import { outboxConfig } from '@app/config';

async function bootstrap() {
  const transportConfig = outboxConfig().transportConfig;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OutboxModule,
    transportConfig,
  );
  await app.listen();
  console.log(
    'Outbox Microservice transport config:',
    JSON.stringify(transportConfig.transport),
  );
}
bootstrap();
