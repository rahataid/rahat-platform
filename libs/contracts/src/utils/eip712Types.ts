const formatType = (schema: { [s: string]: unknown; } | ArrayLike<unknown>) => Object.entries(schema).map(([name, type]) => ({ name, type }))
const mapValues = (obj: any, fn: any) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

const types = mapValues(
    {
        EIP712Domain: {
            name: 'string',
            version: 'string',
            chainId: 'uint256',
            verifyingContract: 'address',
            salt: 'bytes32',
        },
        ForwardRequest: {
            from: 'address',
            to: 'address',
            value: 'uint256',
            gas: 'uint256',
            nonce: 'uint256',
            deadline: 'uint48',
            data: 'bytes',
        },
    },
    formatType,
);

export default { formatType, types }


