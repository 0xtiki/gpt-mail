import { Controller } from '@nestjs/common';
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
  constructor(private readonly outboxService: OutboxService) {}

  @MessagePattern({ cmd: 'sendEmailResponse' })
  async sendEmail(
    @Ctx() context: GCPubSubContext | RmqContext,
    @Payload() input?: string,
  ): Promise<number> {
    const sendMailOptions: ISendMailOptions = JSON.parse(input);
    const completed =
      await this.outboxService.createAndSendResponseEmail(sendMailOptions);

    // Manually acknowledge message after processing is done.
    if (process.env.TRANSPORT === 'amqp') {
      const channel = (context as RmqContext).getChannelRef();
      const originalMsg = context.getMessage();
      channel.ack(originalMsg);
      console.debug('amqp acknowledged');
    } else if (process.env.TRANSPORT === 'gcp') {
      context.getMessage().ack();
      console.debug('gcp acknowledged');
    }

    return completed;
  }
}
