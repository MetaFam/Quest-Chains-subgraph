import {
  ShelfOrdered as ShelfOrderedEvent,
  ShelfEdited as ShelfEditedEvent,
} from '../types/BookFactory/Shelf'
import { ShelfMetadata } from '../types/templates'
import { getShelf } from './helpers'
import { stripProtocol } from './helpers/ipfs'

export function handleShelfOrdered(event: ShelfOrderedEvent): void {
  let shelf = getShelf(event.address)
  shelf.contents = event.params.books.map<string>(book => book.toHexString())
  shelf.save()
}

export function handleShelfEdited(event: ShelfEditedEvent): void {
  let shelf = getShelf(event.address)
  const details = event.params.details
  shelf.details = details
  ShelfMetadata.create(stripProtocol(details))
  shelf.save()
}
