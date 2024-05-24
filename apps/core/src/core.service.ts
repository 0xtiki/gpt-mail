import { Inject, Injectable } from '@nestjs/common';
import { IncomingMessageNotificationDto } from '@app/dtos';
import crypto from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import OpenAI from 'openai';
import { Observable, lastValueFrom } from 'rxjs';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CoreService {
  constructor(
    @Inject('GPT_SERVICE') private gptService: ClientProxy,
    @Inject('OUTBOX_SERVICE') private outboxService: ClientProxy,
    private readonly configService: ConfigService,
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

    // TODO: set up environments
    return process.env.NODE_ENV === 'dev' ? true : encodedToken === signature;
  }

  authenticate() {
    // TODO: implement
    return true;
  }

  async fetchMessage(url: string) {
    return { url };
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
        process.env.NODE_ENV === 'dev'
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

    let authenticated;
    if (verified) {
      authenticated = this.authenticate();
    }

    let message;
    if (authenticated) {
      message = await this.fetchMessage(incomingMessage['message-url']);
    }

    let thread;
    if (message) {
      thread = await this.getThread(message);
    }

    let prompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
    if (thread) {
      prompt = this.composePrompt(thread, incomingMessage['body-plain']);
    }

    const gptResponse = await lastValueFrom(
      this.gptService.send({ cmd: 'generateGptResponse' }, prompt),
    );

    console.log(`cor service: ${gptResponse}`);

    let sendMailOptions: ISendMailOptions;
    if (gptResponse) {
      // await this.updateThread(thread, message, prompt);

      sendMailOptions = this.composeResponseEmail(
        incomingMessage.from,
        gptResponse,
      );

      console.log(sendMailOptions);
    }

    console.log('core service done');

    return this.outboxService.send(
      { cmd: 'sendEmailResponse' },
      sendMailOptions,
    );
  }
}
