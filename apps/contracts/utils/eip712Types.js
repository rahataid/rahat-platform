
const formatType = schema => Object.entries(schema).map(([name, type]) => ({ name, type }));
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

module.exports = mapValues(
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
module.exports.formatType = formatType;
