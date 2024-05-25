import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { GptModule } from './gpt.module';
import { gptConfig } from '@app/config';

async function bootstrap() {
  const transportConfig = gptConfig().transportConfig;
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GptModule,
    transportConfig,
  );
  await app.listen();
  console.log(
    'GPT Microservice transport config:',
    JSON.stringify(transportConfig.options),
  );
}
bootstrap();
