import { IGptServiceInput } from '@app/types';
import { ISendMailOptions } from '@nestjs-modules/mailer';
import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import OpenAI from 'openai';
import { of } from 'rxjs';

@Injectable()
export class GptService implements OnApplicationShutdown {
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
      console.log('failed to generate prompt');
      return of({});
    }

    let chatCompletion: OpenAI.Chat.Completions.ChatCompletion;

    try {
      chatCompletion = await this.openai.chat.completions.create({
        messages: prompt,
        model: gptModel,
      });
    } catch (e) {
      console.log(`chat completion failed ${e}`);
      return of({});
    }

    // TODO : persistent cache response with TTL > job interval

    console.log(`gpt service: ${chatCompletion.choices[0].message}`);

    if (!chatCompletion) {
      console.log('no response received from gptService');
      return of({});
    }

    const sendMailOptions: ISendMailOptions = this.composeResponseEmail(
      input,
      chatCompletion,
    );

    console.log('gptService: forwarding to outbox');

    return this.outboxService.send(
      { cmd: 'sendEmailResponse' },
      JSON.stringify(sendMailOptions),
    );
  }

  onApplicationShutdown(signal?: string) {
    console.log(`Shutting down gracefully ${signal}`);
    console.log('Closing outbox client');
    return this.outboxService.close();
  }
}
