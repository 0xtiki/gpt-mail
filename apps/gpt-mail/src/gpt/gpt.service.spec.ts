import { Test, TestingModule } from '@nestjs/testing';
import { GptServiceService } from './gpt.service';

describe('GptServiceService', () => {
  let service: GptServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GptServiceService],
    }).compile();

    service = module.get<GptServiceService>(GptServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
