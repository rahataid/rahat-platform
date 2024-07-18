export const TokenDetail = `query
 tokendetails {
    tokenCreateds(orderBy: blockTimestamp, orderDirection: desc) {
    blockNumber
    blockTimestamp
    id
    tokenAddress
    transactionHash
  }
    tokenDetails{
    tokenAddress
    totalSupply
    decimals
    id
    name
    symbol
  }
}
`

export const TokensTransfers = `query
tokensTransfers{
transfers(orderBy: blockTimestamp, orderDirection: desc) {
    blockNumber
    blockTimestamp
    from
    id
    to
    transactionHash
    value
    tokenAddress
  }}
`
export const TokenTransfers = `query
tokenTransfers($tokenAddress:String!){
transfers(orderBy: blockTimestamp, orderDirection: desc, where:{tokenAddress: $tokenAddress}) {
    blockNumber
    blockTimestamp
    from
    id
    to
    transactionHash
    value
    tokenAddress
  }}
`

