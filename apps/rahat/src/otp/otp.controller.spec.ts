import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@rumsan/prisma';
import { OtpController } from './otp.controller';
import { OtpService } from './otp.service';

describe('OtpController', () => {
  let controller: OtpController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OtpController],
      providers: [
        OtpService,
        {
          provide: PrismaService,
          useValue: {
            setting: { findUnique: jest.fn(), findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    controller = module.get<OtpController>(OtpController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
