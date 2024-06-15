import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class InboxService implements OnModuleDestroy {
  private readonly logger = new Logger(InboxService.name);

  constructor(@Inject('CORE_SERVICE') private coreServie: ClientProxy) {}
  appendToCoreIncomingQueue(
    messageNotification: IncomingMessageNotificationDto,
  ): Promise<any> {
    this.logger.debug(messageNotification['message-url']);
    this.logger.verbose(messageNotification);
    return lastValueFrom(
      this.coreServie.send(
        { cmd: 'handleIncoming' },
        JSON.stringify(messageNotification),
      ),
    );
  }

  onModuleDestroy() {
    this.coreServie.close();
    this.logger.debug('Client closed');
  }
}
