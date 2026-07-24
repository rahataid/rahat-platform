// This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0.
// If a copy of the MPL was not distributed with this file, You can obtain one at http://mozilla.org/MPL/2.0/.
import { Contract, JsonRpcProvider, ethers } from 'ethers';

function getSignerPrivateKey() {
  const rawPrivateKey =
    process.env.RAHAT_ADMIN_PRIVATE_KEY?.trim() ||
    process.env.PRIVATE_KEY?.trim();
  if (!rawPrivateKey) {
    throw new Error(
      'Missing RAHAT_ADMIN_PRIVATE_KEY or PRIVATE_KEY in environment. Set one to a valid 0x-prefixed private key.'
    );
  }

  const normalizedPrivateKey = rawPrivateKey.startsWith('0x')
    ? rawPrivateKey
    : `0x${rawPrivateKey}`;

  if (!/^0x[0-9a-fA-F]{64}$/.test(normalizedPrivateKey)) {
    throw new Error(
      `Private key has invalid format: ${rawPrivateKey}. Expected a 64-byte hex string with optional 0x prefix.`
    );
  }

  return normalizedPrivateKey;
}

function getNetworkProvider() {
  const providerUrl = process.env.NETWORK_PROVIDER?.trim();
  if (!providerUrl) {
    throw new Error(
      'Missing NETWORK_PROVIDER in environment. Set NETWORK_PROVIDER to your JSON RPC endpoint.'
    );
  }
  return new JsonRpcProvider(providerUrl);
}

export async function createContractSigner(abi: any, address: string) {
  const provider = getNetworkProvider();
  const privateKey = getSignerPrivateKey();
  const wallet = new ethers.Wallet(privateKey, provider);
  const contracts = new Contract(address, abi, wallet);
  return contracts;
}

export async function createContractReader(abi: any, address: string) {
  const provider = getNetworkProvider();
  const contract = new Contract(address, abi, provider);

  return contract;
}

export async function getBlocktimeStamp(txHash: string) {
  const provider = new JsonRpcProvider(process.env.NETWORK_PROVIDER);
  const receipt = await provider.waitForTransaction(txHash);
  if (!receipt) {
    console.error('Transaction is not mined or does not exist.');
    return null;
  }
  const block = await provider.getBlock(receipt.blockNumber);
  return block.timestamp;
}
