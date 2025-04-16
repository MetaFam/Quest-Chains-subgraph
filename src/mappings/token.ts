import { BigInt, Bytes } from '@graphprotocol/graph-ts'
import { BookToken } from '../types/schema'
import { BookTokenMetadata } from '../types/templates'
import {
  BookToken as BookTokenContract,
  TransferSingle as TransferSingleEvent,
  URI as URIEvent,
} from '../types/templates/BookToken/BookToken'
import {
  ADDRESS_ZERO,
  removeFromArray,
  getUser,
  getNetwork,
  hexToI32,
} from './helpers'
import { stripProtocol } from './helpers/ipfs'

export function handleTransferSingle(event: TransferSingleEvent): void {
  let tokenId = event.address
    .toHexString()
    .concat('-')
    .concat(event.params.id.toHexString())
  let token = BookToken.load(tokenId)
  if (token == null) return
  if (event.params.from == ADDRESS_ZERO) {
    let user = getUser(event.params.to)
    let owners = token.owners
    owners.push(user.id)
    token.owners = owners
    token.save()
  } else if (event.params.to == ADDRESS_ZERO) {
    let user = getUser(event.params.from)
    let owners = token.owners
    let newArray = removeFromArray(owners, user.id)
    token.owners = newArray
    token.save()
  }
}

export function handleURIUpdated(event: URIEvent): void {
  let tokenId = event.address
    .toHexString()
    .concat('-')
    .concat(event.params.id.toHexString())
  let token = BookToken.load(tokenId)
  if (token == null) {
    token = new BookToken(tokenId)
    token.owners = new Array<Bytes>()
    token.network = hexToI32(getNetwork())
  }
  let contract = BookTokenContract.bind(event.address)
  token.book = contract.tokenOwner(event.params.id).toHexString()
  token.tokenId = event.params.id
  token.tokenAddress = event.address

  const details = event.params.value
  BookTokenMetadata.create(stripProtocol(details))
  token.details = details
  token.save()
}
