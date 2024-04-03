import { BrainWallet } from '@ethersproject/experimental';
import { keccak256, toUtf8Bytes } from 'ethers';
import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';

const kecc = (str: string) => keccak256(toUtf8Bytes(str));

export function generateWallet(
  identifier: string,
  password?: string
): Promise<BrainWallet> {
  const identifierUInt = kecc(identifier);
  const pass = kecc(password || '9670');
  return BrainWallet.generate(identifierUInt, pass);
}

export const generateRandomWallet = () => {
  const mnemonic = generateMnemonic(english);
  const account = mnemonicToAccount(mnemonic);
  return {
    mnemonic,
    address: account.address,
  };
};
