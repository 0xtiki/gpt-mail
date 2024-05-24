import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { CoreService } from './core.service';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { Observable } from 'rxjs';

@Controller()
export class CoreController {
  constructor(private readonly coreService: CoreService) {}

  @MessagePattern({ cmd: 'handleIncoming' })
  createAndSendResponseEmail(
    input?: IncomingMessageNotificationDto,
  ): Promise<Observable<any>> {
    if (input) {
      return this.coreService.handleIncoming(input);
    }
  }
}
