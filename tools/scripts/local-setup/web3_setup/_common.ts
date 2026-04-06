import { randomBytes } from 'crypto';
import * as dotenv from 'dotenv';
import { ethers, uuidV4 } from 'ethers';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { ContractArtifacts, ContractDetails } from '../../types/contract';
dotenv.config({ path: `${__dirname}/.env.setup` });

export class commonLib {
    provider: ethers.JsonRpcProvider;

    constructor() {
        console.log('Network:', process.env.NETWORK_PROVIDER)
        this.provider = new ethers.JsonRpcProvider(process.env.NETWORK_PROVIDER);
    }
    static getUUID() {
        return uuidV4(randomBytes(16));
    }
    public sleep(ms: number) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
    public getDeployerWallet() {
        return new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY as string, this.provider);
    }
    public async getContractArtifacts(
        contractName: string
    ): Promise<ContractArtifacts> {
        const contract = await import(`../../contracts/${contractName}.json`);
        return contract;
    }
    public async deployContract(contractName: string, args: any[]) {
        const signer = this.getDeployerWallet();
        const { abi, bytecode } = await this.getContractArtifacts(contractName);
        const factory = new ethers.ContractFactory(abi, bytecode, signer);
        const contract = await factory.deploy(...args);
        const address = await contract.getAddress();
        await contract.waitForDeployment();
        const txBlock = await contract.deploymentTransaction()?.getBlock();
        this.sleep(2000);
        return {
            blockNumber: txBlock?.number || 1,
            contract: new ethers.Contract(address, abi, this.provider),
        };
    }

    public async getDeployedAddress(
        contractAddressFile: string,
        contractName: string
    ) {
        const fileData = readFileSync(
            `${__dirname}/deployments/${contractAddressFile}.json`,
            'utf8'
        );
        const data = JSON.parse(fileData);
        return data[contractName].address;
    }

    public async getDeployedContractDetails(
        contractAddressFile: string,
        contractName: string[]
    ) {
        const contractDetails: ContractDetails = {};
        await Promise.all(
            contractName.map(async (contract) => {
                console.log({ contract })
                const address = await this.getDeployedAddress(
                    contractAddressFile,
                    contract
                );
                console.log({ contract, address })
                const { abi } = await this.getContractArtifacts(contract);
                contractDetails[contract] = { address, abi };
            })
        );
        return contractDetails;
    }

    //append to deployment file

    public async writeToDeploymentFile(fileName: string, newData: any) {
        console.log('Writing to deployment file:', fileName);
        const dirPath = `${__dirname}/deployments`;
        const filePath = `${dirPath}/${fileName}.json`;

        // Ensure the directory exists
        if (!existsSync(dirPath)) {
            mkdirSync(dirPath);
        }

        let fileData = {};
        if (existsSync(filePath)) {
            // Read and parse the existing file if it exists
            const existingData = readFileSync(filePath, { encoding: 'utf8' });
            if (existingData) fileData = JSON.parse(existingData);
        }
        fileData = { ...fileData, ...newData };
        writeFileSync(filePath, JSON.stringify(fileData, null, 2));
        console.log("completed writing to deployment file");
    }

}