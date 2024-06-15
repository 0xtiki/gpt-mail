import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { OutboxService } from './outbox.service';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { GCPubSubContext } from 'nestjs-google-pubsub-microservice';

@Controller()
export class OutboxController {
  private readonly logger = new Logger(OutboxController.name);

  constructor(private readonly outboxService: OutboxService) {}

  @MessagePattern({ cmd: 'sendEmailResponse' })
  async sendEmail(
    @Ctx() context: GCPubSubContext | RmqContext,
    @Payload() input?: string,
  ): Promise<boolean> {
    const sendMailOptions: ISendMailOptions = JSON.parse(input);

    this.logger.debug(`Received message id ${context.getMessage().id}`);
    this.logger.verbose(input);

    const ack = !(await this.outboxService
      .createAndSendResponseEmail(sendMailOptions)
      .catch((e) => {
        this.logger.error(e);
        return 1;
      }));

    // Manually acknowledge message after processing is done.

    if (process.env.TRANSPORT === 'amqp') {
      if (ack) {
        const channel = (context as RmqContext).getChannelRef();

        const originalMsg = context.getMessage();

        channel.ack(originalMsg);

        this.logger.debug('Job completed, sending ack');
      }
    } else if (process.env.TRANSPORT === 'gcp') {
      if (ack) {
        context.getMessage().ack();

        this.logger.debug(
          `Job completed, sending ack for message id ${context.getMessage().id}`,
        );
      } else {
        context.getMessage().nack();

        this.logger.warn(
          `Something went wrong, sending nack for message id ${context.getMessage().id}`,
        );
      }
    }

    return ack;
  }
}
