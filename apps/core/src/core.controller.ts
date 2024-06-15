import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CoreService } from './core.service';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { lastValueFrom, of } from 'rxjs';
import { GCPubSubContext } from 'nestjs-google-pubsub-microservice';

@Controller()
export class CoreController {
  private readonly logger = new Logger(CoreController.name);

  constructor(private readonly coreService: CoreService) {}

  @MessagePattern({ cmd: 'handleIncoming' })
  async sanitizeAndForwardToGptService(
    @Ctx() context: GCPubSubContext | RmqContext,
    @Payload() input?: string,
  ): Promise<boolean> {
    if (input) {
      const incomingMesageNotification: IncomingMessageNotificationDto =
        JSON.parse(input);

      this.logger.debug(`Received message id ${context.getMessage().id}`);
      this.logger.verbose(input);

      const { ack } = await lastValueFrom(
        await this.coreService
          .handleIncoming(incomingMesageNotification)
          .catch((e) => {
            this.logger.error(e);
            return of({ ack: false });
          }),
      );

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
}
