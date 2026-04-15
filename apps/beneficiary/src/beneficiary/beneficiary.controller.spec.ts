// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Test, TestingModule } from '@nestjs/testing';
import { BeneficiaryController } from './beneficiary.controller';
import { BeneficiaryService } from './beneficiary.service';
import { BeneficiaryUtilsService } from './beneficiary.utils.service';
import { BeneficiaryStatService } from './beneficiaryStat.service';
import { VerificationService } from './verification.service';

describe('BeneficiaryController', () => {
  let controller: BeneficiaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BeneficiaryController],
      providers: [
        {
          provide: BeneficiaryService,
          useValue: {},
        },
        {
          provide: BeneficiaryUtilsService,
          useValue: {},
        },
        {
          provide: BeneficiaryStatService,
          useValue: {},
        },
        {
          provide: VerificationService,
          useValue: {},
        },
      ],
    }).compile();

    controller = module.get<BeneficiaryController>(BeneficiaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
