import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { OutboxService } from './outbox.service';
import { ISendMailOptions } from '@nestjs-modules/mailer';

@Controller()
export class OutboxController {
  constructor(private readonly outboxService: OutboxService) {}

  @MessagePattern({ cmd: 'sendEmailResponse' })
  sendEmail(@Payload() input?: string): Promise<number> {
    const sendMailOptions: ISendMailOptions = JSON.parse(input);
    return this.outboxService.createAndSendResponseEmail(sendMailOptions);
  }
}
