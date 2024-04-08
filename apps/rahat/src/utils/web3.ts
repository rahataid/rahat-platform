import {
    Contract,
    JsonRpcProvider,
    ethers
} from 'ethers';


export async function createContractSigner(abi: any,address: string) {
 
  //  Create wallet from private key
  const provider = new JsonRpcProvider('https://polygon-mumbai.infura.io/v3/627efc2e63b5449eaf60728ea083fa9d');
  const privateKey = process.env.RAHAT_ADMIN_PRIVATE_KEY;
  const wallet = new ethers.Wallet(privateKey, provider);
  //  Create an instance of the contract
  const contracts =  new Contract(address, abi, wallet);
  return contracts
}