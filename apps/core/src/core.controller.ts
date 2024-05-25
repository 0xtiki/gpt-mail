import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CoreService } from './core.service';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { Observable, of } from 'rxjs';

@Controller()
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @MessagePattern({ cmd: 'handleIncoming' })
  createAndSendResponseEmail(
    @Payload() input?: string,
  ): Promise<Observable<any>> {
    if (input) {
      const incomingMesageNotification: IncomingMessageNotificationDto =
        JSON.parse(input);
      return this.coreService
        .handleIncoming(incomingMesageNotification)
        .catch((e) => {
          console.log(`Failed to forward message to outbox: ${e}`);
          return of({});
        });
    }
  }
}
