export type OfframpProvider<T> = {

    name: string;
    config: T;
    description?: string;
    extras?: any;

}

export type OfframpRequest = {
    providerUuid: string;
    chain: string;
    token: string;
    amount: number;
    senderAddress: string;


}