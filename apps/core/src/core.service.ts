import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { IncomingMessageDto, IncomingMessageNotificationDto } from '@app/dtos';
import crypto from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import { Observable, catchError, firstValueFrom, of } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';
// import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class CoreService implements OnApplicationShutdown {
  constructor(
    @Inject('GPT_SERVICE') private gptService: ClientProxy,
    private readonly httpService: HttpService,
    // private logger: PinoLogger,
  ) {
    // this.logger.setContext(CoreService.name);
  }

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
    // this.logger.info(`authenticating sender: ${sender}`);
    return process.env.EMAIL_WHITELIST.split(',').includes(
      sender.match(
        /(?:[a-z0-9+!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])/gi,
      )[0],
    );
  }

  async fetchMessage(url: string): Promise<IncomingMessageDto> {
    if (process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa')
      return new IncomingMessageDto();

    const { data } = await firstValueFrom(
      this.httpService
        .get<any>(url, {
          headers: {
            Authorization:
              'Basic ' +
              Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString(
                'base64',
              ),
          },
        })
        .pipe(
          catchError((e: AxiosError) => {
            console.error(e.response.data);
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

  // async updateThread(thread, message, prompt) {
  //   // TODO: implement
  //   // console.log(thread, message, prompt);
  // }

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

    const outMessage =
      process.env.NODE_ENV === 'dev' || process.env.NODE_ENV === 'qa'
        ? incomingMessage
        : message;

    try {
      return this.gptService.send(
        { cmd: 'generateGptResponse' },
        JSON.stringify({ message: outMessage, thread }),
      );
    } catch (e) {
      console.log(`gpt service error ${e}`);
      return of({});
    }
  }

  onApplicationShutdown(signal?: string) {
    console.log(`Shutting down gracefully ${signal}`);
    console.log('Closing gpt client');
    return this.gptService.close();
  }
}
