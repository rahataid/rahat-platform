import signMetaTxRequest from "../utils/signer";

export const getMetaTxRequest  = async(signer:any,forwarderContract:any,storageContract:any,functionName:string,params:any) =>{
    const data = storageContract.interface.encodeFunctionData(functionName, params);
    const request = {
        from: await signer.getAddress(),
        to: storageContract.address,
        data,
    };
    return signMetaTxRequest(forwarderContract, request, signer);
}
