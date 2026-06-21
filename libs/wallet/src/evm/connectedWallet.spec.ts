import { Wallet, type TransactionResponse } from 'ethers';
import { ConnectedWallet } from './connectedWallet';
import type {
  EVM_BroadcastedTransaction,
  EVM_UnsignedTransaction,
} from './types';

describe('EVM ConnectedWallet', () => {
  const signer = Wallet.createRandom();
  const walletKeys = {
    address: signer.address,
    privateKey: signer.privateKey,
    publicKey: signer.publicKey,
    blockchain: 'EVM',
  };

  const transactionRequest: EVM_UnsignedTransaction = {
    to: Wallet.createRandom().address,
    nonce: 0,
    type: 2,
    chainId: 11155111,
    gasLimit: BigInt(21_000),
    maxFeePerGas: BigInt(1),
    maxPriorityFeePerGas: BigInt(1),
    value: BigInt(1),
  };

  it('signTransaction serializes an EVM transaction request', async () => {
    const connectedWallet = new ConnectedWallet(
      walletKeys,
      'http://localhost:8545'
    );

    const signedTransaction = await connectedWallet.signTransaction(
      transactionRequest
    );

    expect(typeof signedTransaction).toBe('string');
    expect(signedTransaction.startsWith('0x')).toBe(true);
  });

  it('sendTransaction signs then broadcasts the serialized transaction', async () => {
    const connectedWallet = new ConnectedWallet(
      walletKeys,
      'http://localhost:8545'
    );

    const signedTransaction = '0xsigned-transaction';
    const transactionResponse = {
      hash: '0x123',
    } as EVM_BroadcastedTransaction;

    jest
      .spyOn(connectedWallet, 'signTransaction')
      .mockResolvedValue(signedTransaction);

    if (!connectedWallet.provider) {
      throw new Error('Expected JsonRpcProvider to be initialized');
    }

    const broadcastSpy = jest
      .spyOn(connectedWallet.provider, 'broadcastTransaction')
      .mockResolvedValue(transactionResponse as TransactionResponse);

    await expect(
      connectedWallet.sendTransaction(transactionRequest)
    ).resolves.toBe(transactionResponse);

    expect(broadcastSpy).toHaveBeenCalledWith(signedTransaction);
  });
});
