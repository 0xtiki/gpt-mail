import { registerAs } from '@nestjs/config';
import { RmqOptions, TcpOptions, Transport } from '@nestjs/microservices';

const transportGptOptions = (): TcpOptions | RmqOptions =>
  process.env.NODE_ENV === 'dev'
    ? {
        transport: Transport.TCP,
        options: {
          host: process.env.GPT_SERVICE_HOST || '0.0.0.0',
          port:
            parseInt(process.env.GPT_SERVICE_PORT) ||
            parseInt(process.env.PORT) ||
            3000,
        },
      }
    : {
        transport: Transport.RMQ,
        options: {
          urls: [process.env.AMQP_URL],
          queue: process.env.AMQP_GPT_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      };

export const gptConfig = registerAs(
  'gpt',
  (): {
    transportConfig: TcpOptions | RmqOptions;
    logLevels: string[];
  } => {
    return {
      transportConfig: transportGptOptions(),
      logLevels: process.env.LOG_LEVELS_CORE
        ? process.env.LOG_LEVELS_CORE.split(',')
        : ['log', 'fatal', 'error', 'warn', 'debug'],
    };
  },
);
