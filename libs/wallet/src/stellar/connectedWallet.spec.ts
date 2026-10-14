import { Account, Keypair, Networks } from 'stellar-sdk';
import { ConnectedWallet } from './connectedWallet';
import type { StellarTransactionRequest } from './types';

describe('Stellar ConnectedWallet', () => {
  const signer = Keypair.random();
  const walletKeys = {
    address: signer.publicKey(),
    privateKey: signer.secret(),
    publicKey: signer.publicKey(),
    blockchain: 'STELLAR',
  };

  const createTransactionRequest = (): StellarTransactionRequest => ({
    sourceAccount: new Account(signer.publicKey(), '1'),
    networkPassphrase: Networks.TESTNET,
    timeoutSeconds: 60,
  });

  it('signTransaction returns a signed Stellar transaction envelope', async () => {
    const connectedWallet = new ConnectedWallet(
      walletKeys,
      'http://localhost:8000'
    );

    const signedTransaction = await connectedWallet.signTransaction(
      createTransactionRequest()
    );

    expect(signedTransaction.signatures).toHaveLength(1);
    expect(signedTransaction.networkPassphrase).toBe(Networks.TESTNET);
  });

  it('sendTransaction returns the signed transaction envelope', async () => {
    const connectedWallet = new ConnectedWallet(
      walletKeys,
      'http://localhost:8000'
    );
    const transactionRequest = createTransactionRequest();

    const signSpy = jest.spyOn(connectedWallet, 'signTransaction');
    const signedTransaction = await connectedWallet.sendTransaction(
      transactionRequest
    );

    expect(signSpy).toHaveBeenCalledWith(transactionRequest);
    expect(signedTransaction.signatures).toHaveLength(1);
  });
});
