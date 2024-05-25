import { Inject, Injectable } from '@nestjs/common';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { ClientProxy } from '@nestjs/microservices';
import { Observable } from 'rxjs';

@Injectable()
export class InboxService {
  constructor(@Inject('CORE_SERVICE') private client: ClientProxy) {}
  appendToCoreIncomingQueue(
    messageNotification: IncomingMessageNotificationDto,
  ): Observable<any> {
    return this.client.send(
      { cmd: 'handleIncoming' },
      JSON.stringify(messageNotification),
    );
  }
}
