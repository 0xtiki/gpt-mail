import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';

describe('ClientController', () => {
  let clientController: ClientController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      controllers: [ClientController],
      providers: [
        {
          provide: 'HELLO_SERVICE',
          inject: [ConfigService],
          useFactory: (configService: ConfigService) =>
            ClientProxyFactory.create({
              transport: Transport.TCP,
              options: {
                host: configService.get('HELLO_SERVICE_HOST'),
                port: configService.get('HELLO_SERVICE_PORT'),
              },
            }),
        },
        ClientService,
      ],
    }).compile();

    clientController = app.get<ClientController>(ClientController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(clientController.getHelloByName('there')).toBe('Hello, there!');
    });
  });
});
