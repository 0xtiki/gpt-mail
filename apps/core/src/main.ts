import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { CoreModule } from './core.module';
import { coreConfig } from '@app/config';
import { Logger as PinoLogger } from 'nestjs-pino';

// custom shutdown routine for cloud run jobs.
performance.mark('start');
if (process.env.GCP_CLOUD_RUN_TIMEOUT) {
  const lifetime =
    Number(process.env.GCP_CLOUD_RUN_TIMEOUT.replace(/\D/g, '')) - 5;
  setTimeout(function () {
    console.debug(
      `App shutting down after ${performance.now() - performance.getEntriesByName('start')[0].startTime} ms`,
    );
    process.kill(process.pid, 'SIGTERM');
  }, lifetime * 1000);
}

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
