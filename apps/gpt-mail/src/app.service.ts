import { Injectable } from '@nestjs/common';
import { MailService } from './mail/mail.service';

@Injectable()
export class AppService {
  constructor(private readonly mailService: MailService) {}

  sendHello(input: string): string {
    this.mailService.helloMail(input);
    return `Hello, ${input || 'there'}!`;
  }

  createRoute(input: string): string {
    this.mailService.createRoute(input);
    return `Route created ${input}`;
  }

  listRoutes(): string {
    this.mailService.listRoutes();
    return `Listed`;
  }
}
