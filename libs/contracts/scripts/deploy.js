const { ethers, run, upgrades } = require("hardhat");
const { writeFileSync, readFileSync } = require('fs');

const verify = async (contractAddress, args) => {
    console.log("Verifying contract...");
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        });
    } catch (e) {
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already verified!");
        } else {
            console.log(e);
        }
    }
};


const rahatTokenDetails = {
    name: 'RHT Coin',
    symbol: 'RHT',
    description: 'RHT Coin',
    decimals: 0,
    initialSupply: '100000',
  };

const sleep = (ms) => {
    console.log(`sleeping for ${ms} seconds`)
    return new Promise(resolve => setTimeout(resolve, ms));
}

const writeToFile = (filePath, newData) => {
    const fileData = readFileSync(filePath, 'utf8');
    const data = JSON.parse(fileData);
    data.push(newData);
    writeFileSync(filePath,
        JSON.stringify(data, null, 2))
}

async function main() {
    const[deployer] = await ethers.getSigners();


    console.log("Deploying contracts with the account: ", deployer.address);

    console.log("Deploying Access Manager")

    const AccessManager = await ethers.deployContract("RahatAccessManager",[deployer.address]);
    const AccessManagerAddress = await AccessManager.getAddress();

    console.log("Access Manager address: ", AccessManagerAddress);

    console.log("Deplpying Treasury Contract")
    const treasuryContract = await ethers.deployContract("RahatTreausry",AccessManagerAddress);
    const treasuryContractAddress = await treasuryContract.getAddress();

    console.log("Treasury Contract address: ", treasuryContractAddress);

    console.log("Deploying Rahat Token Contract")
    const RahatToken = await ethers.deployContract("RahatToken",
        [rahatTokenDetails.name,rahatTokenDetails.symbol,rahatTokenDetails.description,
        rahatTokenDetails.decimals,rahatTokenDetails.initialSupply,treasuryContractAddress,
        AccessManagerAddress]);
    const RahatTokenAddress = await RahatToken.getAddress();

    console.log("Rahat Token address: ", RahatTokenAddress);

    writeToFile(`${__dirname}/deployments.json`, {
        AccessManager: AccessManagerAddress,
        Treasury: treasuryContractAddress,
        RahatToken: RahatTokenAddress
    })

    await sleep(5000);

    console.log("Verifying contracts...")
    console.log("Verifying Access Manager...")
    await verify(AccessManagerAddress, [deployer.address]);
    console.log("Verifying Treasury...")
    await verify(treasuryContractAddress, [AccessManagerAddress]);
    console.log("Verifying Rahat Token...")
    await verify(RahatTokenAddress, 
        [rahatTokenDetails.name,rahatTokenDetails.symbol,rahatTokenDetails.description,
        rahatTokenDetails.decimals,rahatTokenDetails.initialSupply,treasuryContractAddress,
        AccessManagerAddress]);
}

main()