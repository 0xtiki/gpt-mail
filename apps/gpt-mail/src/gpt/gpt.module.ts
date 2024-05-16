import { Module } from '@nestjs/common';
import { GptService } from './gpt.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
  providers: [GptService],
  exports: [GptService],
})
export class GptModule {}
