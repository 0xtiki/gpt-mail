import { NestFactory } from '@nestjs/core';
import { ClientModule } from './inbox.module';

async function bootstrap() {
  const app = await NestFactory.create(ClientModule);
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : Number(process.env.INBOX_SERVICE_PORT);
  await app.listen(port);
  console.log(`Inbox Service listening on port ${port}`);
}
bootstrap();
