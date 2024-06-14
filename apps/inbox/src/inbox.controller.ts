import { Controller, Post, Body, Logger } from '@nestjs/common';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { InboxService } from './inbox.service';

@Controller()
export class InboxController {
  private readonly logger = new Logger(InboxController.name);

  constructor(private readonly inboxService: InboxService) {}

  @Post('inbox')
  receiveEmail(@Body() messageNotification: IncomingMessageNotificationDto) {
    this.logger.log(`Received mail from ${messageNotification.from}`);
    return this.inboxService.appendToCoreIncomingQueue(messageNotification);
  }
}
