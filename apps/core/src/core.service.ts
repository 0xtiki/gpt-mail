import { Inject, Injectable } from '@nestjs/common';
import { IncomingMessageNotificationDto } from '@app/dtos';
import crypto from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import OpenAI from 'openai';
import {
  Observable,
  catchError,
  firstValueFrom,
  lastValueFrom,
  of,
} from 'rxjs';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';

@Injectable()
export class CoreService {
  constructor(
    @Inject('GPT_SERVICE') private gptService: ClientProxy,
    @Inject('OUTBOX_SERVICE') private outboxService: ClientProxy,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  verify(
    signingKey: string,
    timestamp: number,
    token: string,
    signature: string,
  ) {
    const encodedToken = crypto
      .createHmac('sha256', signingKey)
      .update(timestamp.toString().concat(token))
      .digest('hex');

    return process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa'
      ? true
      : encodedToken === signature;
  }

  authenticate(sender: string) {
    console.log(`authenticating sender: ${sender}`);
    return process.env.EMAIL_WHITELIST.split(',').includes(
      sender.match(
        /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi,
      )[0],
    );
  }

  async fetchMessage(url: string) {
    if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa')
      return url;

    const { data } = await firstValueFrom(
      this.httpService.get<any>(url).pipe(
        catchError((error: AxiosError) => {
          console.error(error.response.data);
          throw 'An error happened!';
        }),
      ),
    );
    console.log(data);
    return data;
  }

  async getThread(id) {
    return id;
  }

  composePrompt(
    thread,
    message,
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    // TODO: implement
    // console.log(thread);
    return [
      {
        role: 'user',
        content: `Say something very smart about ${message} in less than 10 words.`,
      },
    ];
  }

  // async updateThread(thread, message, prompt) {
  //   // TODO: implement
  //   // console.log(thread, message, prompt);
  // }

  composeResponseEmail(receipient: string, gptResponse): ISendMailOptions {
    // TODO: implement
    // console.log(gptResponse);
    return {
      to:
        process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa'
          ? this.configService.get('RECEIPIENT_EMAIL')
          : receipient,
      from: `${this.configService.get('GPT_MAIL_ASSISTANT_USERNAME')}@${this.configService.get('MAILGUN_SENDING_DOMAIN')}`,
      subject: 'Testing MailerModule ✔',
      text: `${gptResponse ? gptResponse.choices[0].message.content : 'Nothing!'}`,
    };
  }

  validateIncoming(incomingMessage: IncomingMessageNotificationDto) {
    return this.verify(
      process.env.MAILGUN_SIGNING_KEY,
      incomingMessage.timestamp,
      incomingMessage.token,
      incomingMessage.signature,
    );
  }

  async handleIncoming(
    incomingMessage: IncomingMessageNotificationDto,
  ): Promise<Observable<any>> {
    const verified = this.validateIncoming(incomingMessage);

    if (!verified) {
      console.log('email verification failed');
      return of({});
    }

    const authenticated = this.authenticate(incomingMessage.sender);

    if (!authenticated) {
      console.log('email authentication failed');
      return of({});
    }

    const message = await this.fetchMessage(incomingMessage['message-url']);

    if (!message) {
      console.log('fetching message failed');
      return of({});
    }

    const thread = await this.getThread(message);

    if (!thread) {
      console.log('fetching thread failed');
      return of({});
    }

    const prompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      this.composePrompt(
        thread,
        process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa'
          ? incomingMessage['body-plain']
          : message['body-plain'],
      );

    if (!prompt) {
      console.log('failed to generate prompt');
      return of({});
    }

    let gptResponse;
    try {
      gptResponse = await lastValueFrom(
        this.gptService.send(
          { cmd: 'generateGptResponse' },
          JSON.stringify(prompt),
        ),
      );
    } catch (e) {
      console.log('failed to fetch GPT response');
      return of({});
    }

    if (!gptResponse) {
      console.log('no response received from gptService');
      return of({});
    }

    const sendMailOptions: ISendMailOptions = this.composeResponseEmail(
      incomingMessage.from,
      gptResponse,
    );

    console.log('coreService: forwarding to outbox');

    return this.outboxService.send(
      { cmd: 'sendEmailResponse' },
      JSON.stringify(sendMailOptions),
    );
  }
}
