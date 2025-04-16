import { log, Address } from '@graphprotocol/graph-ts'

import {
  BookCreated as BookCreatedEvent,
  ShelfCreated as ShelfCreatedEvent,
  CollectionCreated as CollectionCreatedEvent,
  FactorySetup as FactorySetupEvent,
  AdminReplaced as AdminReplacedEvent,
  PaymentTokenReplaced as PaymentTokenReplacedEvent,
  UpgradeFeeReplaced as UpgradeFeeReplacedEvent,
  BookUpgraded as BookUpgradedEvent,
  BookFactory,
} from '../types/BookFactory/BookFactory'
import {
  Shelf as ShelfTemplate,
  Collection as CollectionTemplate,
  Book as BookTemplate,
  BookToken as BookTokenTemplate,
} from '../types/templates'

import {
  getUser,
  getFactory,
  getBook,
  getShelf,
  getCollection,
  getERC20Token,
  ADDRESS_ZERO,
  getNetwork,
} from './helpers'

import { Factory } from '../types/schema'

export function handleFactorySetup(event: FactorySetupEvent): void {
  let factory = getFactory()
  setupFactory(factory, event.address)
}

function setupFactory(factory: Factory, address: Address): void {
  factory.address = address

  const contract = BookFactory.bind(address)
  factory.bookTemplateAddress = contract.bookTemplate()
  factory.shelfTemplateAddress = contract.shelfTemplate()
  factory.collectionTemplateAddress = contract.collectionTemplate()
  const tokenAddress = contract.bookToken()
  factory.tokenAddress = tokenAddress
  factory.adminAddress = contract.admin()
  // factory.treasuryAddress = contract.treasury()
  // const paymentTokenAddress = contract.paymentToken()
  // const paymentToken = getERC20Token(paymentTokenAddress)
  // factory.paymentToken = paymentToken.id
  // factory.upgradeFee = contract.upgradeFee()

  BookTokenTemplate.create(tokenAddress)
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

export function handleBookCreated(event: BookCreatedEvent): void {
  let book = getBook(event.params.book)

  log.info('handleBookCreated {}', [event.params.book.toHexString()])

  let user = getUser(event.transaction.from)

  book.factory = getNetwork()
  book.createdAt = event.block.timestamp.toI64()
  book.updatedAt = event.block.timestamp.toI64()
  book.creator = user.id
  book.creationTxHash = event.transaction.hash

  book.version = '2'
  book.premium = false

  BookTemplate.create(event.params.book)

  let factory = getFactory()

  if (factory.address == ADDRESS_ZERO) {
    setupFactory(factory, event.address)
  }

  factory.bookCount += 1
  factory.save()

  user.save()
  book.save()
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

export function handleBookUpgraded(event: BookUpgradedEvent): void {
  let book = getBook(event.params.book)

  log.info('handleBookUpgraded {}', [event.params.book.toHexString()])

  book.version = '2'
  book.premium = true

  book.save()
}
