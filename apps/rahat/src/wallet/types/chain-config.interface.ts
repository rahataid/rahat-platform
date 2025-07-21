export interface ChainConfig {
  chainId: string;
  name: string;
  type: 'evm' | 'stellar';
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
  };
}
