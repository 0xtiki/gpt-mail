import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @MessagePattern({ cmd: 'hello' })
  sendHello(input?: string): string {
    return this.appService.sendHello(input);
  }

  @MessagePattern({ cmd: 'create-email-route' })
  createEmailRoute(input?: string): string {
    return this.appService.createRoute(input);
  }

  @MessagePattern({ cmd: 'list-all-email-routes' })
  listRoutes(input?: string): string {
    console.log(input);
    return this.appService.listRoutes();
  }
}
