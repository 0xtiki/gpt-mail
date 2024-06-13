import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CoreModule } from './core.module';
import { coreConfig } from '@app/config';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const transportConfig = coreConfig().transportConfig;

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreModule,
    transportConfig,
  );
  app.useLogger(app.get(PinoLogger));

  app.enableShutdownHooks();

  await app.listen();
}

bootstrap();
