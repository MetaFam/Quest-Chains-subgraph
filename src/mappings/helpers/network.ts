import { dataSource, TypedMap } from '@graphprotocol/graph-ts';

export function getNetwork(): string {
  const network = dataSource.network();
  if (network === 'mainnet') return '0x1';
  if (network === 'kovan') return '0x2a';
  if (network === 'rinkeby') return '0x4';
  if (network === 'ropsten') return '0x3';
  if (network === 'goerli') return '0x5';
  if (network === 'poa-core') return '0x63';
  if (network === 'poa-sokol') return '0x4d';
  if (network === 'gnosis') return '0x64';
  if (network === 'matic') return '0x89';
  if (network === 'mumbai') return '0x13881';
  if (network === 'arbitrum-one') return '0xa4b1';
  if (network === 'arbitrum-goerli') return '0x66eed';
  if (network === 'optimism') return '0xa';
  if (network === 'optimism-kovan') return '0x45';
  if (network === 'aurora') return '0x4e454152';
  if (network === 'aurora-testnet') return '0x4e454153';
  if (network === 'sepolia') return '0xaa36a7';
  if (network === 'holesky') return '0x4268';
  return 'unknown';
}
