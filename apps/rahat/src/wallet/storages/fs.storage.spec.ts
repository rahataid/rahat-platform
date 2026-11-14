import { mkdtemp, mkdir, chmod, readFile, rm, stat, writeFile } from 'fs/promises';
import { tmpdir } from 'os';
import * as path from 'path';
import { FileWalletStorage } from './fs.storage';

describe('FileWalletStorage', () => {
  const keys = {
    address: '0x123',
    blockchain: 'evm',
    privateKey: 'private-key',
    mnemonic: 'mnemonic',
  };
  let root: string;
  let storageDir: string;
  let originalWalletPath: string | undefined;

  beforeEach(async () => {
    originalWalletPath = process.env.WALLET_PATH;
    delete process.env.WALLET_PATH;
    root = await mkdtemp(path.join(tmpdir(), 'rahat-wallet-storage-'));
    storageDir = path.join(root, 'wallets');
  });

  afterEach(async () => {
    if (originalWalletPath === undefined) delete process.env.WALLET_PATH;
    else process.env.WALLET_PATH = originalWalletPath;
    await rm(root, { recursive: true, force: true });
  });

  it('stores and reads wallet keys', async () => {
    const storage = new FileWalletStorage(storageDir);
    await storage.init();
    await storage.saveKey(keys);
    await expect(storage.getKey(keys.address, 'evm')).resolves.toEqual(keys);
  });

  const permissionTest = process.platform === 'win32' ? it.skip : it;

  permissionTest('creates a private directory and key file', async () => {
    const storage = new FileWalletStorage(storageDir);
    await storage.init();
    await storage.saveKey(keys);
    expect((await stat(storageDir)).mode & 0o077).toBe(0);
    expect((await stat(path.join(storageDir, 'EVM_0x123.json'))).mode & 0o777).toBe(0o600);
  });

  permissionTest('restricts an existing key file before overwriting it', async () => {
    await mkdir(storageDir);
    const file = path.join(storageDir, 'EVM_0x123.json');
    await writeFile(file, 'old');
    await chmod(file, 0o644);
    const storage = new FileWalletStorage(storageDir);
    await storage.saveKey(keys);
    expect((await stat(file)).mode & 0o777).toBe(0o600);
    expect(JSON.parse(await readFile(file, 'utf8'))).toEqual(keys);
  });
});
