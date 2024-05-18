import { Controller, Get, Inject, Param, Post, Body } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ReceiveMessageDto } from './receiver.dto';

@Controller('route')
export class RouteController {
  constructor(@Inject('GPT_MAIL_SERVICE') private client: ClientProxy) {}

  @Get('create/:email')
  createEmailRoute(@Param('email') email: string) {
    return this.client.send({ cmd: 'create-email-route' }, email);
  }

  @Post('post')
  receiveEmail(@Body() receiveMessage: ReceiveMessageDto) {
    console.log(receiveMessage);
    return receiveMessage;
  }

  @Get('list')
  listEmailRoutes() {
    return this.client.send({ cmd: 'list-all-email-routes' }, 'null');
  }
}
