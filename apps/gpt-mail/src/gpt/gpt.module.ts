import { Module } from '@nestjs/common';
import { GptServiceService } from './gpt.service';

@Module({
  providers: [GptServiceService],
})
export class GptModule {}
