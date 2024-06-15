import { registerAs } from '@nestjs/config';
import {
  ClientProxy,
  ClientProxyFactory,
  MicroserviceOptions,
  RmqOptions,
  TcpClientOptions,
  TcpOptions,
  Transport,
} from '@nestjs/microservices';
import { IClientProxyFactory } from '@nestjs/microservices/client/client-proxy-factory';
import {
  GCPubSubClient,
  GCPubSubServer,
} from 'nestjs-google-pubsub-microservice';
import mg from 'nodemailer-mailgun-transport';

const transportOutboxOptions = ():
  | TcpOptions
  | RmqOptions
  | MicroserviceOptions => {
  switch (process.env.TRANSPORT) {
    default:
      return {
        transport: Transport.TCP,
        options: {
          host: process.env.OUTBOX_SERVICE_HOST || '0.0.0.0',
          port:
            parseInt(process.env.OUTBOX_SERVICE_PORT) ||
            parseInt(process.env.PORT) ||
            3000,
        },
      };
    case 'gcp':
      return {
        strategy: new GCPubSubServer({
          noAck: false,
          topic: process.env.GCP_OUTBOX_TOPIC,
          subscription: process.env.GCP_OUTBOX_SUBSCRIPTION,
          client: {
            apiEndpoint: process.env.GCP_PUBSUB_API_ENDPOINT,
            projectId: process.env.GCP_PROJECT_ID,
          },
        }),
      };
    case 'amqp':
      return {
        transport: Transport.RMQ,
        options: {
          noAck: false,
          urls: [process.env.CLOUDAMQP_URL],
          queue: process.env.AMQP_OUTBOX_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      };
  }
};

export const outboxConfig = registerAs(
  'outbox',
  (): {
    transportConfig: TcpOptions | RmqOptions | MicroserviceOptions;
    client: ClientProxy | GCPubSubClient;
    pinoTransport: any;
    emailProviderConfig: any;
    context: any;
  } => {
    return {
      transportConfig: transportOutboxOptions(),
      client:
        process.env.TRANSPORT !== 'gcp'
          ? (ClientProxyFactory as IClientProxyFactory).create(
              transportOutboxOptions() as TcpClientOptions | RmqOptions,
            )
          : new GCPubSubClient({
              replyTopic: process.env.GCP_REPLY_TOPIC,
              replySubscription: process.env.GCP_OUTBOX_SUBSCRIPTION,
              topic: process.env.GCP_OUTBOX_TOPIC,
              subscription: process.env.GCP_OUTBOX_SUBSCRIPTION,
              client: {
                apiEndpoint: process.env.GCP_PUBSUB_API_ENDPOINT,
                projectId: process.env.GCP_PROJECT_ID,
              },
            }),
      pinoTransport:
        process.env.NODE_ENV === 'dev' || process.env.PINO_PRETTY
          ? {
              target: 'pino-pretty',
            }
          : {
              target: 'pino-loki',
              options: {
                labels: {
                  app: 'outbox',
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
