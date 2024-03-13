import { Hex } from 'viem/types/misc';

export type VerifySignature = {
    encryptedData: string,
    signature: Hex
}