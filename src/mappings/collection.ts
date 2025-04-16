import {
  CollectionOrdered as CollectionOrderedEvent,
  CollectionEdited as CollectionEditedEvent,
} from '../types/BookFactory/Collection'
import { CollectionMetadata } from '../types/templates'
import { getCollection } from './helpers'
import { stripProtocol } from './helpers/ipfs'

export function handleCollectionOrdered(event: CollectionOrderedEvent): void {
  let collection = getCollection(event.address)
  collection.contents = event.params.shelves.map<string>(shelf =>
    shelf.toHexString(),
  )
  collection.save()
}

export function handleCollectionEdited(event: CollectionEditedEvent): void {
  let collection = getCollection(event.address)
  const details = event.params.details
  collection.details = details
  CollectionMetadata.create(stripProtocol(details))
  collection.save()
}
