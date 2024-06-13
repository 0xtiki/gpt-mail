import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class OutboxService implements OnApplicationShutdown {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly mailerService: MailerService) {}

  public async sendEmail(mailOptions: ISendMailOptions): Promise<number> {
    return this.mailerService
      .sendMail(mailOptions)
      .then((res) => {
        this.logger.log(res);
        return 0;
      })
      .catch((e) => {
        this.logger.log(e);
        return 1;
      });
  }

  public async createAndSendResponseEmail(
    sendMailOptions: ISendMailOptions,
  ): Promise<number> {
    const sendingStatus = await this.sendEmail(sendMailOptions);

    this.logger.log(`Email sending status: ${sendingStatus}`);

    return sendingStatus;
  }

  onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutting down gracefully ${signal}`);
    process.exit(0);
  }
}
