import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { GptService } from '../gpt/gpt.service';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly gptService: GptService,
  ) {}

  public async helloMail(input: string): Promise<void> {
    console.log('fetching gpt response');

    const gptResponse = await this.gptService.chat(input);

    console.log('sending mail');

    this.mailerService
      .sendMail({
        to: this.configService.get('RECEIPIENT_EMAIL'), // list of receivers
        from: `gpt@${this.configService.get('MAILGUN_SENDING_DOMAIN')}`, // sender address
        subject: 'Testing MailerModule ✔', // Subject line
        text: `GPT bro say: ${gptResponse ? gptResponse.choices[0].message.content : 'Nothing!'}`, // plaintext body
        // html: '<b>BOOM</b>', // HTML body content
      })
      .then(() => {
        console.log('email sent');
      })
      .catch((e) => {
        console.log(e);
      });
  }
}
