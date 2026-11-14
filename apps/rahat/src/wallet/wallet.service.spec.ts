import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { BLOCKCHAIN_REGISTRY_TOKEN } from './providers/blockchain-provider.registry';
import { WalletService } from './wallet.service';

describe('WalletService', () => {
  let service: WalletService;
  const wallet = {
    address: '0x123',
    privateKey: 'sensitive-private-key',
    mnemonic: 'sensitive-mnemonic',
  };
  const settings = {
    getByName: jest.fn().mockResolvedValue({
      value: { type: 'evm', rpcUrl: 'https://example.test/secret-rpc-token' },
    }),
  };
  const registry = {
    getSupportedChains: jest.fn().mockReturnValue(['evm']),
    createWallet: jest.fn().mockResolvedValue(wallet),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: SettingsService, useValue: settings },
        { provide: PrismaService, useValue: {} },
        { provide: BLOCKCHAIN_REGISTRY_TOKEN, useValue: registry },
      ],
    }).compile();

    service = module.get<WalletService>(WalletService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('creates wallets without logging keys, mnemonics or chain configuration', async () => {
    const consoleLog = jest.spyOn(console, 'log').mockImplementation();
    const loggerLog = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    try {
      await expect(service.createBulk(1)).resolves.toEqual([
        { chain: 'evm', address: wallet.address, privateKey: wallet.privateKey },
      ]);
      const logOutput = JSON.stringify([...consoleLog.mock.calls, ...loggerLog.mock.calls]);
      expect(logOutput).not.toContain(wallet.privateKey);
      expect(logOutput).not.toContain(wallet.mnemonic);
      expect(logOutput).not.toContain('secret-rpc-token');
    } finally {
      consoleLog.mockRestore();
      loggerLog.mockRestore();
    }
  });
});
