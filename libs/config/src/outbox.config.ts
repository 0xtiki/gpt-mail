import { registerAs } from '@nestjs/config';
import { RmqOptions, TcpOptions, Transport } from '@nestjs/microservices';
import mg from 'nodemailer-mailgun-transport';

const transportOutboxOptions = (): TcpOptions | RmqOptions =>
  process.env.NODE_ENV === 'dev'
    ? {
        transport: Transport.TCP,
        options: {
          host: process.env.OUTBOX_SERVICE_HOST || '0.0.0.0',
          port:
            parseInt(process.env.OUTBOX_SERVICE_PORT) ||
            parseInt(process.env.PORT) ||
            3000,
        },
      }
    : {
        transport: Transport.RMQ,
        options: {
          urls: [process.env.AMQP_URL],
          queue: process.env.AMQP_OUTBOX_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      };

export const outboxConfig = registerAs(
  'outbox',
  (): {
    transportConfig: TcpOptions | RmqOptions;
    logLevels: string[];
    emailProviderConfig: any;
  } => {
    return {
      transportConfig: transportOutboxOptions(),
      logLevels: process.env.LOG_LEVELS_CORE
        ? process.env.LOG_LEVELS_CORE.split(',')
        : ['log', 'fatal', 'error', 'warn', 'debug'],
      emailProviderConfig: {
        transport: mg({
          auth: {
            api_key: process.env.MAILGUN_API_KEY,
            domain: process.env.MAILGUN_SENDING_DOMAIN,
          },
        }),
        defaults: {
          from: `"${process.env.OUTBOX_EMAIL_TITLE}" <${process.env.OUTBOX_EMAIL_USERNAME}@${process.env.MAILGUN_SENDING_DOMAIN}>`,
        },
      },
    };
  },
);
