import { Controller, Post, Body, Logger } from '@nestjs/common';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { InboxService } from './inbox.service';
import { ConfigService } from '@nestjs/config';

@Controller()
export class InboxController {
  constructor(
    private readonly inboxService: InboxService,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(
    `${InboxController.name} ${this.configService.get('inbox').context.gcpTaskCount ? '(' + this.configService.get('inbox').context.gcpTaskIndex + '/' + this.configService.get('inbox').context.gcpTaskCount + ')' : ''}`,
  );

  @Post('inbox')
  receiveEmail(@Body() messageNotification: IncomingMessageNotificationDto) {
    this.logger.log(`Received mail from ${messageNotification.from}`);
    return this.inboxService.appendToCoreIncomingQueue(messageNotification);
  }
}
