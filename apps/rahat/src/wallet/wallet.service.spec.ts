import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { BLOCKCHAIN_REGISTRY_TOKEN } from './providers/blockchain-provider.registry';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        {
          provide: SettingsService,
          useValue: { getByName: jest.fn() },
        },
        {
          provide: PrismaService,
          useValue: {
            beneficiaryPii: { findUnique: jest.fn() },
            beneficiary: { update: jest.fn() },
          },
        },
        {
          provide: BLOCKCHAIN_REGISTRY_TOKEN,
          useValue: {
            getRegisteredChainTypes: jest.fn().mockReturnValue([]),
            getSupportedChains: jest.fn().mockReturnValue([]),
            initializeChain: jest.fn(),
            createWallet: jest.fn(),
            getWalletKeys: jest.fn(),
            connectWallet: jest.fn(),
            importWallet: jest.fn(),
            validateAddress: jest.fn(),
            detectChainFromAddress: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
