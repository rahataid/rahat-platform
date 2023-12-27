import {
  Contract,
  JsonRpcProvider,
  SignatureLike,
  ethers,
  hashMessage,
  recoverAddress,
} from 'ethers';

type IStringArr = string[];
type ICallData = IStringArr[];

export async function createContractInstance(contract: any) {
  //  Get Contract
  //   const contract = await getContractByName(projectName);

  //  Create Provider
  const provider = new JsonRpcProvider('http://localhost:8545');

  //  Create an instance of the contract
  return new Contract(contract.address, contract.abi, provider);
}

export async function createContractInstanceSign(contract: any) {
  //  Get Contract
  //   const contract = await this.getContractByName(projectName);

  //  Create wallet from private key
  const provider = new JsonRpcProvider('http://localhost:8545');
  const privateKey = process.env.RAHAT_ADMIN_PRIVATE_KEY;

  const wallet = new ethers.Wallet(privateKey, provider);

  //  Create an instance of the contract
  return new Contract(contract.address, contract.abi, wallet);
}

export const signMessage = async ({ wallet, message }: any) => {
  try {
    const signature = await wallet.signMessage(JSON.stringify(message));
    return signature;
  } catch (error: any) {
    console.error('Error signing message:', error.message);
    throw error.message;
  }
};

export function verifyMessage(
  message: Uint8Array | string,
  sig: SignatureLike,
): string {
  const digest = hashMessage(message);
  return recoverAddress(digest, sig);
}

export async function generateMultiCallData(
  contract: ethers.Contract,
  functionName: string,
  callData: ICallData,
) {
  const encodedData = [];
  if (callData) {
    for (const callD of callData) {
      const encodedD = contract.interface.encodeFunctionData(functionName, [
        ...callD,
      ]);
      encodedData.push(encodedD);
    }
  }
  return encodedData;
}

export async function multiSend(
  contract: ethers.Contract,
  functionName: string,
  callData?: ICallData,
) {
  const encodedData = await generateMultiCallData(
    contract,
    functionName,
    callData,
  );
  const tx = await contract.multicall(encodedData);
  const result = await tx.wait();
  return result;
}

export async function getFunctionsList(contractInstance: any) {
  const functions = contractInstance.interface.fragments;
  const funcArr = [];
  functions.forEach((fragment: any) => {
    if (fragment.type === 'function') {
      funcArr.push(fragment?.name);
    }
  });

  return funcArr;
}