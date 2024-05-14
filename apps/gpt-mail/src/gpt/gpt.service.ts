import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class GptServiceService {
  openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
  });

  async chat() {
    const chatCompletion = await this.openai.chat.completions.create({
      messages: [{ role: 'user', content: 'Say this is a test' }],
      model: 'gpt-3.5-turbo',
    });

    console.log(chatCompletion);
  }
}
