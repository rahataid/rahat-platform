const types = require('./eip712Types');

async function getDomain(contract) {
  const { fields, name, version, chainId, verifyingContract, salt, extensions } = await contract.eip712Domain();

  if (extensions.length > 0) {
    throw Error('Extensions not implemented');
  }

  const domain = {
    name,
    version,
    chainId,
    verifyingContract,
    salt,
  };

  for (const [i, { name }] of types.EIP712Domain.entries()) {
    if (!(fields & (1 << i))) {
      delete domain[name];
    }
  }

  return domain;
}

async function buildRequest(forwarderContract, input) {
  const nonce = await forwarderContract
    .nonces(input.from);
  return {
    from: input.from,
    to: input.to,
    value: BigInt(0),
    data: input.data,
    gas: BigInt(1e6),
    deadline: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    nonce
  }
}

async function buildTypedData(forwarderContract) {
  const domain = await getDomain(forwarderContract)
  const ForwardRequest = types.ForwardRequest;
  return {
    domain,
    types: { ForwardRequest },
  }
}

async function signMetaTxRequest(signer, forwarderContract, input) {
  const request = await buildRequest(forwarderContract, input)
  const { domain, types } = await buildTypedData(forwarderContract)
  const signature = await signer.signTypedData(domain, types, request);
  request.signature = signature
  return request;
}

const generateMultiCallData = (
  contract,
  functionName,
  callData
) => {
  let encodedData = [];
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

module.exports = {
  signMetaTxRequest,
  buildRequest,
  buildTypedData,
  generateMultiCallData
}
