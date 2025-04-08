
  function getContractArtifacts(contractName) {
    const contract = require(`../abis/${contractName}.json`);
    return contract;
  }

  function delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  async function getDeployedContractDetails(contractsDetails) {
    const contractDetails = {};
    for (const contract of contractsDetails) {
      const { abi } = getContractArtifacts(contract.name);
      contractDetails[contract.name] = {
        address: contract.address,
        abi,
      };
    }
    return contractDetails;
  }



module.exports = { getContractArtifacts,  delay, getDeployedContractDetails};
