import { IGptServiceInput } from '@app/types';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import OpenAI from 'openai';
import { of } from 'rxjs';

@Injectable()
export class GptService implements OnApplicationShutdown {
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

  async handleIncoming(input: IGptServiceInput, gptModel: string) {
    const prompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      this.composePrompt(input);

    if (!prompt) {
      this.logger.log('failed to generate prompt');
      return of({});
    }

    let chatCompletion: OpenAI.Chat.Completions.ChatCompletion;

    try {
      chatCompletion = await this.openai.chat.completions.create({
        messages: prompt,
        model: gptModel,
      });
    } catch (e) {
      this.logger.log(`chat completion failed ${e}`);
      return of({});
    }

    // TODO : persistent cache response with TTL > job interval

    this.logger.log(`gpt service: ${chatCompletion.choices[0].message}`);

    if (!chatCompletion) {
      this.logger.log('no response received from gptService');
      return of({});
    }

    const sendMailOptions: ISendMailOptions = this.composeResponseEmail(
      input,
      chatCompletion,
    );

    this.logger.log('gptService: forwarding to outbox');

    return this.outboxService.send(
      { cmd: 'sendEmailResponse' },
      JSON.stringify(sendMailOptions),
    );
  }

  onApplicationShutdown(signal?: string) {
    this.logger.log(`Shutting down gracefully ${signal}`);
    this.outboxService.close();
    this.logger.log('Client closed');
    process.exit(0);
  }
}
