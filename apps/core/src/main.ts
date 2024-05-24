import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { CoreModule } from './core.module';

async function bootstrap() {
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : Number(process.env.CORE_SERVICE_PORT);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    CoreModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );
  await app.listen();
  console.log('Core Microservice listening on port:', port);
}
bootstrap();
