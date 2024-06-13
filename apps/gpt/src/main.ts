import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GptModule } from './gpt.module';
import { gptConfig } from '@app/config';
import { Logger as PinoLogger } from 'nestjs-pino';

async function bootstrap() {
  const transportConfig = gptConfig().transportConfig;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GptModule,
    transportConfig,
  );

  app.useLogger(app.get(PinoLogger));

  app.enableShutdownHooks();

  await app.listen();
}
bootstrap();
