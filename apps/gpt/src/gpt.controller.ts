import { Controller, Logger } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { GptService } from './gpt.service';
import { IGptServiceInput } from '@app/types';
import { Observable, lastValueFrom, of } from 'rxjs';
import { GCPubSubContext } from 'nestjs-google-pubsub-microservice';

@Controller()
export class GptController {
  private readonly logger = new Logger(GptController.name);

  constructor(private readonly gptService: GptService) {}

  @MessagePattern({ cmd: 'generateGptResponse' })
  async fetchGptResponse(
    @Ctx() context: GCPubSubContext | RmqContext,
    @Payload() input?: string,
  ): Promise<Observable<{ ack: boolean }>> {
    const incoming: IGptServiceInput = JSON.parse(input);

    const gptModel: string = 'gpt-3.5-turbo';

    this.logger.debug(`Received message id ${context.getMessage().id}`);
    this.logger.verbose(input);

    const { ack } = await lastValueFrom(
      await this.gptService.handleIncoming(incoming, gptModel).catch((e) => {
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

    return of({ ack: ack });
  }
}
