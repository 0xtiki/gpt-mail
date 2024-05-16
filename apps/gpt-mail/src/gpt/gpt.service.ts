import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class GptService {
  constructor(private readonly configService: ConfigService) {}

  openai = new OpenAI({
    apiKey: this.configService.get('OPENAI_API_KEY'), // This is the default and can be omitted
  });

  async chat(input: string) {
    let chatCompletion: OpenAI.Chat.Completions.ChatCompletion;

    try {
      chatCompletion = await this.openai.chat.completions.create({
        messages: [
          {
            role: 'user',
            content: `Say something very smart about ${input} in less than 10 words.`,
          },
        ],
        model: 'gpt-3.5-turbo',
      });
    } catch (e) {
      console.log(e);
    }

    console.log(chatCompletion.choices[0].message);
    return chatCompletion;
  }
}
