import { registerAs } from '@nestjs/config';

export const inboxConfig = registerAs(
  'inbox',
  (): {
    pinoTransport: any;
    context: any;
  } => {
    return {
      pinoTransport:
        process.env.NODE_ENV === 'dev' || process.env.PINO_PRETTY
          ? {
              target: 'pino-pretty',
            }
          : {
              target: 'pino-loki',
              options: {
                labels: {
                  app: 'inbox',
                  env: process.env.NODE_ENV,
                },
                replaceTimestamp: true,
                batching: true,
                interval: 2,
                host: process.env.LOKI_URL,
                basicAuth: {
                  username: process.env.LOKI_USERNAME,
                  password: process.env.LOKI_PASSWORD,
                },
              },
            },
      context: {
        transport: (() => {
          if (process.env.TRANSPORT === 'gcp') {
            return 'Pub/Sub';
          } else if (process.env.TRANSPORT === 'amqp') {
            return 'RabbitMQ - CloudAMQP';
          }
          return 'TCP';
        })(),
        gcpTaskIndex: (() => {
          if (
            process.env.TRANSPORT === 'gcp' &&
            process.env.NODE_ENV === 'prod'
          ) {
            return process.env.CLOUD_RUN_TASK_INDEX;
          }
          undefined;
        })(),
        gcpTaskCount: (() => {
          if (
            process.env.TRANSPORT === 'gcp' &&
            process.env.NODE_ENV === 'prod'
          ) {
            return process.env.CLOUD_RUN_TASK_COUNT;
          }
          undefined;
        })(),
      },
    };
  },
);
