import eipTypes from './eip712Types';

const getDomain = async (contract: any) => {
    const { field, name, version, chainId, verifyingContract, salt, extensions } = await contract.EIP712Domain();

    if (extensions.length > 0) {
        throw new Error('EIP712: Domain extensions not supported');
    }

    const domain = {
        name,
        version,
        chainId,
        verifyingContract,
        salt,
    };

    for (const [i, { name }] of eipTypes.types['EIP712Domain'].entries()) {
        if (!(field & (1 << i))) {
            // @ts-expect-error - TS doesn't know that the field is optional
            delete domain[name];

        }
    }
    return domain;

}

const buildRequest = async (forwarderContract: any, input: any) => {
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

const buildTypedData = async (forwarderContract: any) => {
    const domain = await getDomain(forwarderContract)
    const ForwardRequest = eipTypes.types['ForwardRequest'];
    return {
        domain,
        types: { ForwardRequest },
    }
}

const signMetaTxRequest = async (forwarderContract: any, input: any, signer: any) => {
    const request = await buildRequest(forwarderContract, input);
    const typedData = await buildTypedData(forwarderContract);
    const signature = await signer._signTypedData(typedData.domain, { ForwardRequest: request });
    return { request, signature };
}

// const getMetaTxRequest  = async(signer:any,forwarderContract:any,storageContract:any,functionName:string,params:any) =>{
//     const data = storageContract.interface.encodeFunctionData(functionName, params);
//     const request = {
//         from: await signer.getAddress(),
//         to: storageContract.address,
//         data,
//     };
//     return signMetaTxRequest(forwarderContract, request, signer);
// }
export default signMetaTxRequest;