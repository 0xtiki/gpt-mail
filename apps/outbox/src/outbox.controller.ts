import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { OutboxService } from './outbox.service';
import { ISendMailOptions } from '@nestjs-modules/mailer';

@Controller()
export class OutboxController {
  constructor(private readonly outboxService: OutboxService) {}

  @MessagePattern({ cmd: 'sendEmailResponse' })
  sendEmail(input?: ISendMailOptions): Promise<number> {
    return this.outboxService.createAndSendResponseEmail(input);
  }
}
