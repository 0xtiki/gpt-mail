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
import { LokiLogLevel } from 'pino-loki';

const transportGptOptions = ():
  | TcpOptions
  | RmqOptions
  | MicroserviceOptions => {
  switch (process.env.TRANSPORT) {
    default:
      return {
        transport: Transport.TCP,
        options: {
          host: process.env.GPT_SERVICE_HOST || '0.0.0.0',
          port:
            parseInt(process.env.GPT_SERVICE_PORT) ||
            parseInt(process.env.PORT) ||
            3000,
        },
      };
    case 'gcp':
      return {
        strategy: new GCPubSubServer({
          noAck: false,
          topic: process.env.GCP_GPT_TOPIC,
          subscription: process.env.GCP_GPT_SUBSCRIPTION,
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
          queue: process.env.AMQP_GPT_QUEUE,
          queueOptions: {
            durable: true,
          },
        },
      };
  }
};

export const gptConfig = registerAs(
  'gpt',
  (): {
    transportConfig: TcpOptions | RmqOptions | MicroserviceOptions;
    client: ClientProxy | GCPubSubClient;
    pinoTransport: any;
    context: any;
  } => {
    return {
      transportConfig: transportGptOptions(),
      client:
        process.env.TRANSPORT !== 'gcp'
          ? (ClientProxyFactory as IClientProxyFactory).create(
              transportGptOptions() as TcpClientOptions | RmqOptions,
            )
          : new GCPubSubClient({
              replyTopic: process.env.GCP_REPLY_TOPIC,
              replySubscription: process.env.GCP_REPLY_SUBSCRIPTION,
              topic: process.env.GCP_GPT_TOPIC,
              subscription: process.env.GCP_GPT_SUBSCRIPTION,
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
                  app: 'gpt',
                  env: process.env.NODE_ENV,
                },
                levelMap: {
                  10: LokiLogLevel.Debug,
                  20: LokiLogLevel.Debug,
                  30: LokiLogLevel.Info,
                  40: LokiLogLevel.Warning,
                  50: LokiLogLevel.Error,
                  60: LokiLogLevel.Critical,
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
