import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { GptService } from './gpt.service';
import OpenAI from 'openai';

@Controller()
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @MessagePattern({ cmd: 'generateGptResponse' })
  fetchGptResponse(
    input?: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
    gptModel: string = 'gpt-3.5-turbo',
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    return this.gptService.chat(input, gptModel);
  }
}
