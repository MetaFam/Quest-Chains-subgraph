import { Address, BigInt, Bytes, ethereum } from '@graphprotocol/graph-ts'
import { ERC20 } from '../../types/BookFactory/ERC20'
import {
  User,
  Factory,
  Book,
  Chapter,
  Shelf,
  Collection,
  ERC20Token,
} from '../../types/schema'
import { getNetwork } from './network'
import { ADDRESS_ZERO } from './constants'
import { stripProtocol } from './ipfs'
import { ChapterMetadata } from '../../types/templates'
import { hexToI32 } from './strings'

export function getUser(address: Address): User {
  let user = User.load(address)
  if (user == null) {
    user = new User(address)
    user.chaptersPassed = new Array<string>()
    user.chaptersFailed = new Array<string>()
    user.chaptersInReview = new Array<string>()
  }
  return user as User
}

export function getFactory(): Factory {
  let network = getNetwork()
  let factory = Factory.load(network)
  if (factory == null) {
    factory = new Factory(network)
    factory.address = ADDRESS_ZERO
    factory.bookTemplateAddress = ADDRESS_ZERO
    factory.shelfTemplateAddress = ADDRESS_ZERO
    factory.collectionTemplateAddress = ADDRESS_ZERO
    factory.tokenAddress = ADDRESS_ZERO
    factory.adminAddress = ADDRESS_ZERO
    factory.treasuryAddress = ADDRESS_ZERO
    let paymentToken = getERC20Token(ADDRESS_ZERO)
    factory.paymentToken = paymentToken.id

    paymentToken.save()
    factory.upgradeFee = BigInt.fromI32(0)
    factory.bookCount = 0
  }

  return factory as Factory
}

export function getERC20Token(address: Address): ERC20Token {
  let token = ERC20Token.load(address.toHexString())
  if (token == null) {
    token = new ERC20Token(address.toHexString())

    const erc20 = ERC20.bind(address)
    const nameValue = erc20.try_name()
    const symbolValue = erc20.try_symbol()
    const decimalsValue = erc20.try_decimals()

    token.name = nameValue.reverted ? '' : nameValue.value
    token.symbol = symbolValue.reverted ? '' : symbolValue.value
    token.decimals = decimalsValue.reverted ? 0 : decimalsValue.value
  }
  return token as ERC20Token
}

export function getBook(address: Address): Book {
  let book = Book.load(address.toHexString())
  if (book == null) {
    const network = getNetwork()

    book = new Book(address.toHexString())

    book.address = address
    book.network = hexToI32(network)

    book.numCompletedUsers = 0
    book.completedUsers = new Array<Bytes>()
    book.numUsers = 0
    book.users = new Array<Bytes>()

    book.chapterCount = 0
    book.totalChapterCount = 0
    book.paused = false

    book.owners = new Array<Bytes>()
    book.admins = new Array<Bytes>()
    book.editors = new Array<Bytes>()
    book.reviewers = new Array<Bytes>()

    book.chaptersPassed = new Array<string>()
    book.chaptersFailed = new Array<string>()
    book.chaptersInReview = new Array<string>()
  }
  return book as Book
}

export function getShelf(address: Address): Shelf {
  let shelf = Shelf.load(address.toHexString())
  if (shelf == null) {
    const network = getNetwork()

    shelf = new Shelf(address.toHexString())

    shelf.address = address
    shelf.network = hexToI32(network)

    shelf.admins = new Array<Bytes>()
  }
  return shelf as Shelf
}

export function getCollection(address: Address): Collection {
  let collection = Collection.load(address.toHexString())
  if (collection == null) {
    const network = getNetwork()

    collection = new Collection(address.toHexString())

    collection.factory = network
    collection.address = address
    collection.network = hexToI32(network)

    collection.admins = new Array<Bytes>()
  }
  return collection as Collection
}

export function createChapter(
  address: Address,
  chapterIndex: BigInt,
  details: string,
  creator: Address,
  event: ethereum.Event,
): Chapter {
  let chapter = getChapter(address, chapterIndex)
  chapter.createdAt = event.block.timestamp.toI64()
  chapter.updatedAt = event.block.timestamp.toI64()

  chapter.details = details
  ChapterMetadata.create(stripProtocol(details))
  chapter.creationTxHash = event.transaction.hash

  let user = getUser(creator)
  chapter.creator = user.id
  user.save()

  return chapter
}

export function getChapter(address: Address, chapterIndex: BigInt): Chapter {
  let chapterId = address
    .toHexString()
    .concat('-')
    .concat(chapterIndex.toHexString())
  let chapter = Chapter.load(chapterId)
  if (chapter == null) {
    chapter = new Chapter(chapterId)

    chapter.book = address.toHexString()
    chapter.chapterId = chapterIndex
    chapter.optional = false
    chapter.skipReview = false
    chapter.paused = false

    chapter.numCompletedUsers = 0
    chapter.completedUsers = new Array<Bytes>()
    chapter.numUsers = 0
    chapter.users = new Array<Bytes>()

    chapter.usersPassed = new Array<string>()
    chapter.usersFailed = new Array<string>()
    chapter.usersInReview = new Array<string>()
  }
  return chapter as Chapter
}
