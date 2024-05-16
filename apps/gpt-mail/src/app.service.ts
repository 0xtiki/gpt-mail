import { Injectable } from '@nestjs/common';
import { MailService } from './mail/mail.service';

@Injectable()
export class AppService {
  constructor(private readonly mailService: MailService) {}

  sendHello(input: string): string {
    this.mailService.helloMail(input);
    return `Hello, ${input || 'there'}!`;
  }
}
