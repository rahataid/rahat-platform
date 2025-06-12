import { ChainType } from "@rahataid/wallet";

export class PhoneNumberDto {
    phoneNumber: string
}

export class WalletAddressDto {
    walletAddress: string;
    chain: ChainType
}

export class BulkWalletAddressDto {
    walletAddresses: string[];
    chain: ChainType
}

export class PhoneAddressDto {
    phoneNumber: string;
    chain: ChainType
}