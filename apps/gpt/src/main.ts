import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { GptModule } from './gpt.module';

async function bootstrap() {
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : Number(process.env.GPT_SERVICE_PORT);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    GptModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );
  await app.listen();
  console.log('GPT Microservice listening on port:', port);
}
bootstrap();
