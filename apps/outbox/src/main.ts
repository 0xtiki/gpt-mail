import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { OutboxModule } from './outbox.module';

async function bootstrap() {
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : Number(process.env.OUTBOX_SERVICE_PORT);
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OutboxModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port,
      },
    },
  );
  await app.listen();
  console.log('Outbox Microservice listening on port:', port);
}
bootstrap();
