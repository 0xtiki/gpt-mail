import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { CoreService } from './core.service';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { Observable, of } from 'rxjs';
import { GCPubSubContext } from 'nestjs-google-pubsub-microservice';

@Controller()
export class CoreController {
  private readonly logger = new Logger(CoreController.name);

  constructor(private readonly coreService: CoreService) {}

  @MessagePattern({ cmd: 'handleIncoming' })
  async sanitizeAndForwardToGptService(
    @Ctx() context: GCPubSubContext | RmqContext,
    @Payload() input?: string,
  ): Promise<Observable<any>> {
    if (input) {
      const incomingMesageNotification: IncomingMessageNotificationDto =
        JSON.parse(input);

      const completed = await this.coreService
        .handleIncoming(incomingMesageNotification)
        .catch((e) => {
          this.logger.error(e);
          return of({});
        });

      // Manually acknowledge message after processing is done.
      if (process.env.TRANSPORT === 'amqp') {
        const channel = (context as RmqContext).getChannelRef();
        const originalMsg = context.getMessage();
        channel.ack(originalMsg);
        this.logger.debug('Job completed, sending ack');
      } else if (process.env.TRANSPORT === 'gcp') {
        context.getMessage().ack();
        this.logger.debug('Job completed, sending ack');
      }

      return completed;
    }
  }
}
