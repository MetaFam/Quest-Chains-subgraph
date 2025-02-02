import {
  ShelfOrdered as ShelfOrderedEvent,
  ShelfEdited as ShelfEditedEvent,
} from '../../types/QuestChainFactoryV2/Shelf'
import { ShelfMetadata } from '../../types/templates'
import { getShelf } from '../helpers'
import { stripProtocol } from '../helpers/ipfs'

export function handleShelfOrdered(event: ShelfOrderedEvent): void {
  let shelf = getShelf(event.address)
  shelf.contents = event.params.chains.map<string>(chain => chain.toHexString())
  shelf.save()
}

export function handleShelfEdited(event: ShelfEditedEvent): void {
  let shelf = getShelf(event.address)
  const details = event.params.details
  shelf.details = details
  ShelfMetadata.create(stripProtocol(details))
  shelf.save()
}
