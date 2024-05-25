import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CoreModule } from './core.module';
import { coreConfig } from '@app/config';

async function bootstrap() {
  const transportConfig = coreConfig().transportConfig;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreModule,
    transportConfig,
  );
  await app.listen();
  console.log(
    'Core Microservice transport config:',
    JSON.stringify(transportConfig.transport),
  );
}
bootstrap();
