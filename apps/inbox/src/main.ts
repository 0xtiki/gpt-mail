import { NestFactory } from '@nestjs/core';
import { InboxModule } from './inbox.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger as PinoLogger } from 'nestjs-pino';
import { Logger } from '@nestjs/common';
import { inboxConfig } from '@app/config';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(InboxModule);
  app.useLogger(app.get(PinoLogger));
  const { transport, gcpTaskCount, gcpTaskIndex } = inboxConfig().context;
  const logger = new Logger(
    `InboxMain (${transport}) ${gcpTaskCount ? '-Task: ' + gcpTaskIndex + '/' + gcpTaskCount : ''}`,
  );
  process.env.TRUST_PROXY ?? app.set('trust proxy', 1);
  const port = process.env.PORT
    ? Number(process.env.PORT)
    : Number(process.env.INBOX_SERVICE_PORT);
  await app.listen(port);
  logger.log(`listening on port ${port}`);
}
bootstrap();
