import { english, generateMnemonic, mnemonicToAccount } from 'viem/accounts';

export const generateRandomWallet = () => {
  const mnemonic = generateMnemonic(english);
  const account = mnemonicToAccount(mnemonic);
  return {
    mnemonic,
    address: account.address,
  };
};
