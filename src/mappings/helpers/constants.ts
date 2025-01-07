import { Address } from '@graphprotocol/graph-ts'

export const ADDRESS_ZERO: Address = changetype<Address>(
  Address.fromHexString('0x0000000000000000000000000000000000000000'),
)
