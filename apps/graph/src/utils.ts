import { Address, BigInt } from "@graphprotocol/graph-ts";
import { TokenDetail } from "../generated/schema";
import { RahatToken } from "../generated/templates/RahatToken/RahatToken";


export function fetchTokenDetails(tokenAddress: Address): TokenDetail | null {
    let tokendetail = TokenDetail.load(tokenAddress);

    const contract = RahatToken.bind(tokenAddress);
    const tokenName = contract.try_name();
    const decimals = contract.try_decimals();
    const symbol = contract.try_symbol();
    const totalSupply = contract.try_totalSupply();

    if (!tokendetail) {
        tokendetail = new TokenDetail(tokenAddress);
        tokendetail.name = tokenName.value;
        tokendetail.decimals = new BigInt(decimals.value);
        tokendetail.symbol = symbol.value;
        tokendetail.totalSupply = totalSupply.value
        tokendetail.tokenAddress = tokenAddress
        tokendetail.save()
    }
    if (tokendetail) {
        tokendetail.totalSupply = totalSupply.value
        tokendetail.save()
    }
    return tokendetail

}