import { IGptServiceInput } from '@app/types';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import OpenAI from 'openai';
import { Observable, lastValueFrom, of } from 'rxjs';

@Injectable()
export class GptService implements OnModuleDestroy {
  private readonly logger = new Logger(GptService.name);

  constructor(
    private readonly configService: ConfigService,
    @Inject('OUTBOX_SERVICE') private outboxService: ClientProxy,
  ) {}

  openai = new OpenAI({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  composeResponseEmail(
    input: IGptServiceInput,
    gptResponse: OpenAI.Chat.Completions.ChatCompletion,
  ): ISendMailOptions {
    return {
      to: input.message.sender,
      from: `${this.configService.get('GPT_MAIL_ASSISTANT_USERNAME')}@${this.configService.get('MAILGUN_SENDING_DOMAIN')}`,
      subject: `Re: ${input.message.subject}`,
      text: `${gptResponse ? gptResponse.choices[0].message.content : 'No response'}`,
    };
  }

  composePrompt(
    input: IGptServiceInput,
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    return [
      {
        role: 'user',
        content: `Say something very smart about ${input.message['body-plain']} in less than 10 words.`,
      },
    ];
  }

  async handleIncoming(
    input: IGptServiceInput,
    gptModel: string,
  ): Promise<Observable<{ ack: boolean }>> {
    const prompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      this.composePrompt(input);

    if (!prompt) {
      this.logger.warn('failed to generate prompt');
      return of({ ack: false });
    }

    let chatCompletion: OpenAI.Chat.Completions.ChatCompletion;

    try {
      chatCompletion = await this.openai.chat.completions.create({
        messages: prompt,
        model: gptModel,
      });
    } catch (e) {
      this.logger.error('Chat completion failed');
      this.logger.verbose(e);
      return of({ ack: true });
    }

    // TODO : persistent cache response with TTL > job interval

    this.logger.log(
      `Prompt: ${prompt} \nChat response: ${chatCompletion.choices[0].message}`,
    );

    if (!chatCompletion) {
      this.logger.warn('No response received from gptService');
      return of({ ack: false });
    }

    const sendMailOptions: ISendMailOptions = this.composeResponseEmail(
      input,
      chatCompletion,
    );

    this.logger.log('Forwarding message to outbox');

    try {
      lastValueFrom(
        this.outboxService.send(
          { cmd: 'sendEmailResponse' },
          JSON.stringify(sendMailOptions),
        ),
      );
      return of({ ack: true });
    } catch (e) {
      this.logger.error('Outbox service error');
      this.logger.verbose(e);
      return of({ ack: false });
    }
  }

  onModuleDestroy() {
    this.outboxService.close();
  }
}
