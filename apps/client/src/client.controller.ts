import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('hello')
export class ClientController {
  constructor(@Inject('GPT_MAIL_SERVICE') private client: ClientProxy) {}

  @Get(':name')
  getHelloByName(@Param('name') name = 'there') {
    return this.client.send({ cmd: 'hello' }, name);
  }
}
