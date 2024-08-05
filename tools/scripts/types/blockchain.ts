export type ITokenDeploymentData = {
  communityName: string;
  projectName: string;
  tokenName: string;
  tokenSymbol: string;
  tokenDecimals: number;
  projectManager: string;
};

export type INetworkKeys = {
  privateKey: string;
  publicKey?: string;
  address?: string;
};
