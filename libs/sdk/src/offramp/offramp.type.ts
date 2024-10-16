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

export type KotaniPayExecutionData = {
    chain: string;
    token: string;
    transaction_hash: string;
    wallet_id: string;
    request_id: string;
    customer_key: string;
};

export type ExecuteOfframpRequest = {
    providerUuid: string;
    requestUuid: string;
    data: KotaniPayExecutionData;
}
