import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GptModule } from './gpt/gpt.module';
import { MailModule } from './mail/mail.module';

@Module({
  imports: [GptModule, MailModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
