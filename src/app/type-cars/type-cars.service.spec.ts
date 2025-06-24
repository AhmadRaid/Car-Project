import { Test, TestingModule } from '@nestjs/testing';
import { TypeCarsService } from './type-cars.service';

describe('TypeCarsService', () => {
  let service: TypeCarsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeCarsService],
    }).compile();

    service = module.get<TypeCarsService>(TypeCarsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
