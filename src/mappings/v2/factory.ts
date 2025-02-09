import { log, Address } from '@graphprotocol/graph-ts'

import {
  QuestChainCreated as QuestChainCreatedEvent,
  ShelfCreated as ShelfCreatedEvent,
  CollectionCreated as CollectionCreatedEvent,
  FactorySetup as FactorySetupEvent,
  AdminReplaced as AdminReplacedEvent,
  PaymentTokenReplaced as PaymentTokenReplacedEvent,
  UpgradeFeeReplaced as UpgradeFeeReplacedEvent,
  QuestChainUpgraded as QuestChainUpgradedEvent,
  QuestChainFactoryV2 as QuestChainFactory,
} from '../../types/QuestChainFactoryV2/QuestChainFactoryV2'
import {
  Shelf as ShelfTemplate,
  Collection as CollectionTemplate,
  QuestChainV2 as QuestChainTemplate,
  QuestChainTokenV2 as QuestChainTokenTemplate,
} from '../../types/templates'

import {
  getUser,
  getFactory,
  getQuestChain,
  getShelf,
  getCollection,
  getERC20Token,
  ADDRESS_ZERO,
  getNetwork,
} from '../helpers'

import { Factory } from '../../types/schema'

export function handleFactorySetup(event: FactorySetupEvent): void {
  let factory = getFactory()
  setupFactory(factory, event.address)
}

function setupFactory(factory: Factory, address: Address): void {
  factory.address = address

  const contract = QuestChainFactory.bind(address)
  factory.chainTemplateAddress = contract.chainTemplate()
  factory.shelfTemplateAddress = contract.shelfTemplate()
  factory.collectionTemplateAddress = contract.collectionTemplate()
  const tokenAddress = contract.chainToken()
  factory.tokenAddress = tokenAddress
  factory.adminAddress = contract.admin()
  // factory.treasuryAddress = contract.treasury()
  // const paymentTokenAddress = contract.paymentToken()
  // const paymentToken = getERC20Token(paymentTokenAddress)
  // factory.paymentToken = paymentToken.id
  // factory.upgradeFee = contract.upgradeFee()

  QuestChainTokenTemplate.create(tokenAddress)
  // paymentToken.save()
  factory.save()
}

export function handleAdminReplaced(event: AdminReplacedEvent): void {
  let factory = getFactory()
  factory.adminAddress = event.params.admin
  factory.save()
}

export function handlePaymentTokenReplaced(
  event: PaymentTokenReplacedEvent,
): void {
  let factory = getFactory()
  let paymentTokenAddress = event.params.paymentToken
  let paymentToken = getERC20Token(paymentTokenAddress)
  factory.paymentToken = paymentToken.id
  factory.save()
}

export function handleUpgradeFeeReplaced(event: UpgradeFeeReplacedEvent): void {
  let factory = getFactory()
  factory.upgradeFee = event.params.upgradeFee
  factory.save()
}

export function handleQuestChainCreated(event: QuestChainCreatedEvent): void {
  let questChain = getQuestChain(event.params.questChain)

  log.info('handleQuestChainCreated {}', [
    event.params.questChain.toHexString(),
  ])

  let user = getUser(event.transaction.from)

  questChain.factory = getNetwork()
  questChain.createdAt = event.block.timestamp.toI64()
  questChain.updatedAt = event.block.timestamp.toI64()
  questChain.creator = user.id
  questChain.creationTxHash = event.transaction.hash

  questChain.version = '2'
  questChain.premium = false

  QuestChainTemplate.create(event.params.questChain)

  let factory = getFactory()

  if (factory.address == ADDRESS_ZERO) {
    setupFactory(factory, event.address)
  }

  factory.questChainCount += 1
  factory.save()

  user.save()
  questChain.save()
}

export function handleShelfCreated(event: ShelfCreatedEvent): void {
  let shelf = getShelf(event.params.shelf)

  log.info('handleShelfCreated {}', [event.params.shelf.toHexString()])

  let user = getUser(event.transaction.from)

  shelf.tokenId = event.params.tokenId
  shelf.factory = getNetwork()
  shelf.createdAt = event.block.timestamp.toI64()
  shelf.updatedAt = event.block.timestamp.toI64()
  shelf.creator = user.id
  shelf.creationTxHash = event.transaction.hash

  ShelfTemplate.create(event.params.shelf)

  user.save()
  shelf.save()
}

export function handleCollectionCreated(event: CollectionCreatedEvent): void {
  let collection = getCollection(event.params.collection)

  log.info('handleCollectionCreated {}', [
    event.params.collection.toHexString(),
  ])

  let user = getUser(event.transaction.from)

  collection.factory = getNetwork()
  collection.createdAt = event.block.timestamp.toI64()
  collection.updatedAt = event.block.timestamp.toI64()
  collection.creator = user.id
  collection.creationTxHash = event.transaction.hash

  CollectionTemplate.create(event.params.collection)

  user.save()
  collection.save()
}

export function handleQuestChainUpgraded(event: QuestChainUpgradedEvent): void {
  let questChain = getQuestChain(event.params.questChain)

  log.info('handleQuestChainUpgraded {}', [
    event.params.questChain.toHexString(),
  ])

  questChain.version = '2'
  questChain.premium = true

  questChain.save()
}
