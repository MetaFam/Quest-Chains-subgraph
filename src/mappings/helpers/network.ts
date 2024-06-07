import { dataSource } from '@graphprotocol/graph-ts';

export function getNetwork(): string {
  const network = dataSource.network();
  const networkMap: { [key: string]: string } = {
    'mainnet': '0x1',
    'kovan': '0x2a',
    'rinkeby': '0x4',
    'ropsten': '0x3',
    'goerli': '0x5',
    'poa-core': '0x63',
    'poa-sokol': '0x4d',
    'gnosis': '0x64',
    'matic': '0x89',
    'mumbai': '0x13881',
    'arbitrum-one': '0xa4b1',
    'arbitrum-goerli': '0x66eed',
    'optimism': '0xa',
    'optimism-kovan': '0x45',
    'aurora': '0x4e454152',
    'aurora-testnet': '0x4e454153',
    'sepolia': '0xaa36a7',
    'holesky': '0x4268'
  };

  return networkMap[network] || 'unknown';
}
