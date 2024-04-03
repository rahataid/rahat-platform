import { BrainWallet } from '@ethersproject/experimental';
import { keccak256, toUtf8Bytes } from 'ethers';

const kecc = (str: string) => keccak256(toUtf8Bytes(str));

export function generateWallet(
  identifier: string,
  password?: string
): Promise<BrainWallet> {
  const identifierUInt = kecc(identifier);
  const pass = kecc(password || '9670');
  return BrainWallet.generate(identifierUInt, pass);
}
