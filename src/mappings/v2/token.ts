import { Bytes } from '@graphprotocol/graph-ts'
import { QuestChainToken } from '../../types/schema'
import { QuestChainTokenMetadata } from '../../types/templates'

import {
  QuestChainTokenV2 as QuestChainTokenContract,
  TransferSingle as TransferSingleEvent,
  URI as URIEvent,
} from '../../types/templates/QuestChainTokenV2/QuestChainTokenV2'
import { ADDRESS_ZERO, removeFromArray, Metadata, getUser } from '../helpers'
import { stripProtocol } from '../helpers/ipfs'

export function handleTransferSingle(event: TransferSingleEvent): void {
  let tokenId = event.address
    .toHexString()
    .concat('-')
    .concat(event.params.id.toHexString())
  let token = QuestChainToken.load(tokenId)
  if (token == null) {
    return
  }
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
  let token = QuestChainToken.load(tokenId)
  if (token == null) {
    token = new QuestChainToken(tokenId)
    token.owners = new Array<Bytes>()
  }
  let contract = QuestChainTokenContract.bind(event.address)
  token.questChain = contract.tokenOwner(event.params.id).toHexString()
  token.tokenId = event.params.id
  token.tokenAddress = event.address

  const details = event.params.value
  QuestChainTokenMetadata.create(stripProtocol(details))
  token.details = details
  token.save()
}
