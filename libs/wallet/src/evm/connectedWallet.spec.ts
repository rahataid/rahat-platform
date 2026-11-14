import { Transaction, TransactionResponse, Wallet } from 'ethers';
import { ConnectedWallet } from './connectedWallet';
import { getEVMTransaction } from './utils';

jest.mock('./utils', () => ({ getEVMTransaction: jest.fn() }));

describe('EVM connected wallet transactions', () => {
  const key = '0x0123456789012345678901234567890123456789012345678901234567890123';
  const signer = new Wallet(key);
  const transaction = {
    to: '0x1111111111111111111111111111111111111111' as const,
    chainId: 1,
    nonce: 0,
    gasLimit: 21000,
    gasPrice: 1,
    value: 1,
  };
  let wallet: ConnectedWallet;
  const failure = new Error('broadcast failed');

  beforeEach(() => {
    jest.clearAllMocks();
    wallet = new ConnectedWallet({
      address: signer.address,
      privateKey: key,
      blockchain: 'EVM',
    }, 'http://localhost:8545');
  });

  it('signs the request and broadcasts the serialized transaction', async () => {
    if (!wallet.provider) throw new Error('Provider was not initialized');
    const broadcast = jest.spyOn(wallet.provider, 'broadcastTransaction')
      .mockRejectedValue(failure);
    await expect(wallet.sendTransaction(transaction)).rejects.toThrow('broadcast failed');
    const signed = Transaction.from(broadcast.mock.calls[0][0]);
    expect(signed.from).toBe(signer.address);
    expect(signed.to).toBe(transaction.to);
    expect(signed.value).toBe(BigInt(1));
  });

  it('returns the provider response after a successful broadcast', async () => {
    if (!wallet.provider) throw new Error('Provider was not initialized');
    const signed = Transaction.from(await wallet.signTransaction(transaction));
    if (!signed.signature || !signed.hash || signed.type === null || signed.gasPrice === null) {
      throw new Error('Transaction was not signed as a legacy transaction');
    }
    const response = new TransactionResponse({
      blockNumber: null,
      blockHash: null,
      hash: signed.hash,
      index: 0,
      type: signed.type,
      to: signed.to,
      from: signer.address,
      nonce: signed.nonce,
      gasLimit: signed.gasLimit,
      gasPrice: signed.gasPrice,
      maxPriorityFeePerGas: signed.maxPriorityFeePerGas,
      maxFeePerGas: signed.maxFeePerGas,
      data: signed.data,
      value: signed.value,
      chainId: signed.chainId,
      signature: signed.signature,
      accessList: signed.accessList,
    }, wallet.provider);
    jest.spyOn(wallet.provider, 'broadcastTransaction').mockResolvedValue(response);
    await expect(wallet.sendTransaction(transaction)).resolves.toBe(response);
  });

  it('signs a contract transaction once and propagates broadcast errors', async () => {
    jest.mocked(getEVMTransaction).mockResolvedValue(transaction);
    const sign = jest.spyOn(wallet, 'signTransaction');
    if (!wallet.provider) throw new Error('Provider was not initialized');
    const broadcast = jest.spyOn(wallet.provider, 'broadcastTransaction')
      .mockRejectedValue(failure);

    await expect(wallet.writeContract({
      privateKey: key,
      txnParams: {
        abi: [],
        contractAddress: transaction.to,
        functionName: 'transfer',
        args: [],
      },
    })).rejects.toThrow('broadcast failed');
    expect(sign).toHaveBeenCalledTimes(1);
    expect(sign).toHaveBeenCalledWith(transaction);
    expect(Transaction.from(broadcast.mock.calls[0][0]).from).toBe(signer.address);
  });
});
