import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { GptService } from './gpt.service';
import OpenAI from 'openai';

@Controller()
export class GptController {
  constructor(private readonly gptService: GptService) {}

  @MessagePattern({ cmd: 'generateGptResponse' })
  fetchGptResponse(
    @Payload() input?: string,
  ): Promise<OpenAI.Chat.Completions.ChatCompletion> {
    const prompt: OpenAI.Chat.Completions.ChatCompletionMessageParam[] =
      JSON.parse(input);
    const gptModel: string = 'gpt-3.5-turbo';
    return this.gptService.chat(prompt, gptModel);
  }
}
