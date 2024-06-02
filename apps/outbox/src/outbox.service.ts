import { Injectable } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class OutboxService {
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
    // TODO: clean up
    console.log(sendMailOptions.text);

    const sendingStatus = await this.sendEmail(sendMailOptions);

    console.log(`Email sending status: ${sendingStatus}`);

    return sendingStatus;
  }
}
