import {
  Contract,
  InterfaceAbi,
  TransactionReceipt,
  TransactionResponse,
} from 'ethers';

export interface ContractArtifacts {
  contractName: string;
  bytecode: string;
  abi: InterfaceAbi;
}

export type DeployedContractData = {
  [key: string]: {
    contractName: string;
    address: string;
    contract: Contract;
    abi: InterfaceAbi;
    startBlock: number;
  };
};

export type ContractDetails = { [key: string]: { address: string; abi: any } };
