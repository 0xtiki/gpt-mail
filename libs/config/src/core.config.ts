import { registerAs } from '@nestjs/config';
import { RmqOptions, TcpOptions, Transport } from '@nestjs/microservices';

const transportCoreOptions = (): TcpOptions | RmqOptions =>
  process.env.NODE_ENV === 'dev'
    ? {
        transport: Transport.TCP,
        options: {
          host: process.env.CORE_SERVICE_HOST || '0.0.0.0',
          port:
            parseInt(process.env.CORE_SERVICE_PORT) ||
            parseInt(process.env.PORT) ||
            3000,
        },
      }
    : {
        transport: Transport.RMQ,
        options: {
          urls: [process.env.CLOUDAMQP_URL],
          queue: process.env.AMQP_CORE_INBOX_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      };

export const coreConfig = registerAs(
  'core',
  (): {
    transportConfig: TcpOptions | RmqOptions;
    logLevels: string[];
  } => {
    return {
      transportConfig: transportCoreOptions(),
      logLevels: process.env.LOG_LEVELS_CORE
        ? process.env.LOG_LEVELS_CORE.split(',')
        : ['log', 'fatal', 'error', 'warn', 'debug'],
    };
  },
);
