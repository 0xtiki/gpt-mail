import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { GptService } from '../gpt/gpt.service';
import fetch from 'node-fetch';

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
    private readonly gptService: GptService,
  ) {}

  public async listRoutes(): Promise<void> {
    const resp = await fetch(`https://api.mailgun.net/v3/routes`, {
      method: 'GET',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64'),
      },
    });

    const data = await resp.text();
    console.log(data);
  }

  public async createRoute(address: string): Promise<void> {
    const FormData = (await import('form-data')).default;

    console.log(`creating route ${address}`);

    const form = new FormData();
    form.append('priority', '0');
    form.append('description', 'test route4');
    form.append(
      'expression',
      `match_recipient('chat@${process.env.MAILGUN_SENDING_DOMAIN}')`,
    );
    form.append(
      'action[0]',
      'forward("https://69e1-184-22-101-127.ngrok-free.app/route/post/")]',
    );

    const resp = await fetch(`https://api.mailgun.net/v3/routes`, {
      method: 'POST',
      headers: {
        Authorization:
          'Basic ' +
          Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64'),
      },
      body: form,
    });

    const data = await resp.text();
    console.log(data);
  }

  public async helloMail(input: string): Promise<void> {
    console.log('fetching gpt response');

    const gptResponse = await this.gptService.chat(input);

    console.log('sending mail');

    this.mailerService
      .sendMail({
        to: this.configService.get('RECEIPIENT_EMAIL'), // list of receivers
        from: `${this.configService.get('GPT_MAIL_ASSISTANT_USERNAME')}@${this.configService.get('MAILGUN_SENDING_DOMAIN')}`, // sender address
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
