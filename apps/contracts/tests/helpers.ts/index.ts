import { ethers } from "ethers";

export const getFunctionId = (signature: string) => {
    return ethers.FunctionFragment.from(signature).selector;
}
