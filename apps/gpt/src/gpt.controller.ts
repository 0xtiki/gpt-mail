import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { GptService } from './gpt.service';
import { IGptServiceInput } from '@app/types';
import { Observable } from 'rxjs';
import { GCPubSubContext } from 'nestjs-google-pubsub-microservice';

@Controller()
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @MessagePattern({ cmd: 'generateGptResponse' })
  async fetchGptResponse(
    @Ctx() context: GCPubSubContext | RmqContext,
    @Payload() input?: string,
  ): Promise<Observable<any>> {
    const incoming: IGptServiceInput = JSON.parse(input);

    const gptModel: string = 'gpt-3.5-turbo';

    const completed = await this.gptService.handleIncoming(incoming, gptModel);

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
