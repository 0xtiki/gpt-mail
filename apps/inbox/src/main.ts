import { NestFactory } from '@nestjs/core';
import { InboxModule } from './inbox.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as PinoLogger } from 'nestjs-pino';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(InboxModule);
  app.useLogger(app.get(PinoLogger));
  const logger = new Logger();
  process.env.TRUST_PROXY ?? app.set('trust proxy', true);
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : Number(process.env.INBOX_SERVICE_PORT);
  await app.listen(port);
  logger.log(`Listening on port ${port}`);
}
bootstrap();
