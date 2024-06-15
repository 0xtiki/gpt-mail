import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { IncomingMessageDto, IncomingMessageNotificationDto } from '@app/dtos';
import crypto from 'crypto';
import { ClientProxy } from '@nestjs/microservices';
import {
  Observable,
  catchError,
  firstValueFrom,
  lastValueFrom,
  of,
} from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AxiosError } from 'axios';

@Injectable()
export class CoreService implements OnModuleDestroy {
  private readonly logger = new Logger(CoreService.name);

  constructor(
    @Inject('GPT_SERVICE') private gptService: ClientProxy,
    private readonly httpService: HttpService,
  ) {}

  onModuleDestroy() {
    this.gptService.close();
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
            this.logger.error(e.response.data);
            throw 'Error fetching email from';
          }),
        ),
    );
    this.logger.verbose(data);
    return data;
  }

  async getThread(id) {
    return id;
  }

  // async updateThread(thread, message, prompt) {
  //   // TODO: implement
  //   // this.logger.log(thread, message, prompt);
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
  ): Promise<Observable<{ ack: boolean }>> {
    const verified = this.validateIncoming(incomingMessage);

    if (!verified) {
      this.logger.warn('Email verification failed');
      return of({ ack: true });
    }

    const authenticated = this.authenticate(incomingMessage.sender);

    if (!authenticated) {
      this.logger.warn('Email authentication failed');
      return of({ ack: true });
    }

    const message = await this.fetchMessage(incomingMessage['message-url']);

    if (!message) {
      this.logger.warn('Fetching message from mg failed');
      return of({ ack: false });
    }

    const thread = await this.getThread(message);

    if (!thread) {
      this.logger.warn('fetching thread failed');
      return of({ ack: false });
    }

    const outMessage =
      process.env.NODE_ENV !== 'prod' ? incomingMessage : message;

    try {
      this.logger.error('HERE');
      lastValueFrom(
        this.gptService.send(
          { cmd: 'generateGptResponse' },
          JSON.stringify({ message: outMessage, thread }),
        ),
      );
      return of({ ack: true });
    } catch (e) {
      this.logger.error('GPT service error');
      this.logger.verbose(e);
      return of({ ack: false });
    }
  }
}
