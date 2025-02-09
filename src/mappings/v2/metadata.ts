import {
  Bytes,
  dataSource,
  Entity,
  json,
  JSONValue,
  Value,
} from '@graphprotocol/graph-ts'
import {
  Category,
  QuestChainMetadata,
  QuestChainTokenMetadata,
  QuestMetadata,
  ShelfMetadata,
  CollectionMetadata,
  SubmissionMetadata,
} from '../../types/schema'
import { createSearchString, getNetwork } from '../helpers'

class KVPair {
  constructor(
    public key: string,
    public value: JSONValue | null,
  ) {}
}

function copyValues(out: Entity, vals: Array<KVPair>): void {
  for (let i = 0; i < vals.length; i++) {
    if (vals[i].value) {
      out.set(vals[i].key, Value.fromString(vals[i].value!.toString()))
    }
  }
}

function mapCategories(cats: JSONValue | null): Array<string> {
  if (cats) {
    return cats.toArray().map<string>(cat => {
      const str = cat.toString()
      const lower = str.toLowerCase()
      let db = Category.load(lower)
      if (!db) {
        db = new Category(lower)
        db.name = str
        db.save()
      }
      return lower
    })
  }
  return []
}

export function handleQuestChainTokenMetadata(content: Bytes): void {
  const out = new QuestChainTokenMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('image', ipfs.get('image')),
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
      new KVPair('animationURL', ipfs.get('animation_url')),
      new KVPair('externalURL', ipfs.get('external_url')),
      new KVPair('mimeType', ipfs.get('mime_type')),
    ])
    out.save()
  }
}

export function handleQuestMetadata(content: Bytes): void {
  const out = new QuestMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
    ])
    out.save()
  }
}

export function handleQuestChainMetadata(content: Bytes): void {
  const out = new QuestChainMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('image', ipfs.get('cover')),
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
      new KVPair('externalURL', ipfs.get('external_url')),
      new KVPair('slug', ipfs.get('slug')),
    ])

    out.categories = mapCategories(ipfs.get('categories'))

    out.save()
  }
}

export function handleShelfMetadata(content: Bytes): void {
  const out = new ShelfMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
      new KVPair('cover', ipfs.get('cover')),
      new KVPair('slug', ipfs.get('slug')),
    ])

    out.categories = mapCategories(ipfs.get('categories'))

    out.save()
  }
}

export function handleCollectionMetadata(content: Bytes): void {
  const out = new CollectionMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
      new KVPair('cover', ipfs.get('cover')),
      new KVPair('slug', ipfs.get('slug')),
    ])

    out.categories = mapCategories(ipfs.get('categories'))

    out.save()
  }
}

export function handleSubmissionMetadata(content: Bytes): void {
  const out = new SubmissionMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('image', ipfs.get('image')),
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
      new KVPair('externalURL', ipfs.get('external_url')),
    ])
    out.save()
  }
}
