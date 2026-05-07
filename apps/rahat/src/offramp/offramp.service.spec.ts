// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@rumsan/prisma';
import { KotaniPayService } from './offrampProviders/kotaniPay.service';
import { OfframpService } from './offramp.service';

describe('OfframpService', () => {
  let service: OfframpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfframpService,
        {
          provide: PrismaService,
          useValue: {
            offrampProvider: { create: jest.fn(), findUnique: jest.fn() },
            offrampRequest: { create: jest.fn(), findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
            offrampTransaction: { create: jest.fn() },
          },
        },
        {
          provide: KotaniPayService,
          useValue: {
            kotaniPayActions: {},
            createOfframpRequest: jest.fn(),
            executeOfframpRequest: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OfframpService>(OfframpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
