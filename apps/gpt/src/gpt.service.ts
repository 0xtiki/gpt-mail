import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class GptService {
  constructor(private readonly configService: ConfigService) {}

  openai = new OpenAI({
    apiKey: this.configService.get('OPENAI_API_KEY'),
  });

  async chat(
    input: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    gptModel: string,
  ) {
    let chatCompletion: OpenAI.Chat.Completions.ChatCompletion;

    try {
      chatCompletion = await this.openai.chat.completions.create({
        // TODO: clean up
        // e.g.
        // [
        //   {
        //     role: 'user',
        //     content: `Say something very smart about ${input} in less than 10 words.`,
        //   },
        // ],
        messages: input,
        model: gptModel,
      });
    } catch (e) {
      console.log(e);
    }

    console.log(`gpt service: ${chatCompletion.choices[0].message}`);
    return chatCompletion;
  }
}
