import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class OutboxService implements OnApplicationShutdown {
  constructor(private readonly mailerService: MailerService) {}

  public async sendEmail(mailOptions: ISendMailOptions): Promise<number> {
    return this.mailerService
      .sendMail(mailOptions)
      .then((res) => {
        console.log(res);
        return 0;
      })
      .catch((e) => {
        console.log(e);
        return 1;
      });
  }

  public async createAndSendResponseEmail(
    sendMailOptions: ISendMailOptions,
  ): Promise<number> {
    const sendingStatus = await this.sendEmail(sendMailOptions);

    console.log(`Email sending status: ${sendingStatus}`);

    return sendingStatus;
  }

  onApplicationShutdown(signal?: string) {
    console.log(`Shutting down gracefully ${signal}`);
  }
}
