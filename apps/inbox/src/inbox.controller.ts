import { Controller, Post, Body } from '@nestjs/common';
import { IncomingMessageNotificationDto } from '@app/dtos';
import { InboxService } from './inbox.service';

@Controller()
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  // TODO: clean up
  // @Get('create/:email')
  // createEmailRoute(@Param('email') email: string) {
  //   return this.client.send({ cmd: 'create-email-route' }, email);
  // }

  @Post('inbox')
  receiveEmail(@Body() messageNotification: IncomingMessageNotificationDto) {
    console.log(`Received mail from ${messageNotification.from}`);
    return this.inboxService.appendToCoreIncomingQueue(messageNotification);
  }
}
