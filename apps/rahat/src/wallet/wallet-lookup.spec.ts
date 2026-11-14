import { Test } from '@nestjs/testing';
import { SettingsService } from '@rumsan/extensions/settings';
import { PrismaService } from '@rumsan/prisma';
import { BLOCKCHAIN_REGISTRY_TOKEN } from './providers/blockchain-provider.registry';
import { WalletService } from './wallet.service';

describe('wallet key lookup', () => {
  const registry = {
    getSupportedChains: jest.fn().mockReturnValue(['evm', 'stellar']),
    getWalletKeys: jest.fn(),
  };
  let service: WalletService;

  beforeEach(async () => {
    registry.getWalletKeys.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        WalletService,
        { provide: SettingsService, useValue: {} },
        { provide: PrismaService, useValue: {} },
        { provide: BLOCKCHAIN_REGISTRY_TOKEN, useValue: registry },
      ],
    }).compile();
    service = module.get(WalletService);
  });

  it('returns a wallet found on a later chain', async () => {
    const keys = { address: 'address', privateKey: 'key', blockchain: 'stellar' };
    registry.getWalletKeys.mockResolvedValueOnce(null).mockResolvedValueOnce(keys);
    await expect(service.getSecretByWallet('address')).resolves.toEqual(keys);
    expect(registry.getWalletKeys.mock.calls).toEqual([
      ['address', 'evm'],
      ['address', 'stellar'],
    ]);
  });

  it('returns null only when every lookup reports no wallet', async () => {
    registry.getWalletKeys.mockResolvedValue(null);
    await expect(service.getSecretByWallet('address')).resolves.toBeNull();
    expect(registry.getWalletKeys).toHaveBeenCalledTimes(2);
  });

  it('propagates storage failures instead of reporting a missing wallet', async () => {
    const failure = new Error('storage unavailable');
    registry.getWalletKeys.mockRejectedValue(failure);
    await expect(service.getSecretByWallet('address')).rejects.toBe(failure);
    expect(registry.getWalletKeys).toHaveBeenCalledTimes(1);
  });

  it('propagates storage failures for an explicitly selected chain', async () => {
    const failure = new Error('corrupt wallet data');
    registry.getWalletKeys.mockRejectedValue(failure);
    await expect(service.getSecretByWallet('address', 'evm')).rejects.toBe(failure);
    expect(registry.getWalletKeys).toHaveBeenCalledWith('address', 'evm');
  });
});
