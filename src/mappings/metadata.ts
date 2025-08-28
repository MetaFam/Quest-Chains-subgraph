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
  BookMetadata,
  BookTokenMetadata,
  ChapterMetadata,
  ShelfMetadata,
  CollectionMetadata,
  SubmissionMetadata,
} from '../types/schema'
import { createSearchString, getNetwork } from './helpers'

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

class ErrorObject {
  msg: string | null
  cause: Error | null
}
class MapCategoriesResult {
  names: (() => Array<string>) | null
}
class MapCategoriesReturn {
  ok: boolean
  err: ErrorObject
  result: MapCategoriesResult
}
class MapCategoriesMapResult {
  name: string | null
  cat: Category | null
}
class MapCategoriesMapReturn {
  ok: boolean
  err: ErrorObject
  result: MapCategoriesMapResult
}
class GetCatResult {
  cat: Category | null
}
class GetCatReturn {
  ok: boolean
  err: ErrorObject
  result: GetCatResult
}
class GetCatOpts {
  count: i32
  max: i32
}

const MAX_CHECKS = 2_500
function getCat(name: string, opts: GetCatOpts): GetCatReturn {
  if (++opts.count > opts.max)
    return {
      ok: false,
      err: { msg: 'Max loops exceeded', cause: null },
      result: { cat: null },
    }
  const lower = name.toLowerCase()
  const cat = Category.load(lower)
  if (cat == null) return getCat(name, { count: opts.count, max: MAX_CHECKS })
  return { ok: true, result: { cat }, err: { msg: null, cause: null } }
}

function mapCategories(cats: JSONValue | null): MapCategoriesReturn {
  return {
    ok: false,
    result: { names: null },
    err: { msg: 'Short circuiting.', cause: null },
  }
  if (cats) {
    const search = cats
      ? cats!
          .toArray()
          .map<MapCategoriesMapReturn>(
            (json: JSONValue): MapCategoriesMapReturn => {
              const name = json.toString()
              const retrieve = getCat(name, { count: 0, max: MAX_CHECKS })
              const found = retrieve.result.cat != null
              return {
                ok: found,
                result: { name, cat: retrieve.result.cat },
                err: { msg: null, cause: null },
              }
            },
          )
      : null
    if (search) {
      return {
        ok: search
          ? ((): boolean =>
              search!.reduce(
                (acc: boolean, val: MapCategoriesMapReturn) =>
                  acc && val.ok && val.result != null && val.result.cat != null,
                true,
              ))()
          : null,
        result: {
          names: () => {
            return search
              ? (search!
                  .map<string | null | false>((val: MapCategoriesMapReturn) => {
                    if (val.result.cat == null) return false
                    return val.result.name
                  })
                  .filter(Boolean) as Array<string>)
              : []
          },
        },
        err: { msg: null, cause: null },
      }
    }
    return {
      ok: false,
      result: { names: null },
      err: { msg: 'No `search` returned.', cause: null },
    }
  }
  return {
    ok: false,
    result: { names: null },
    err: { msg: '`cats` is unset.', cause: null },
  }
}

export function handleBookTokenMetadata(content: Bytes): void {
  const out = new BookTokenMetadata('ipfs://' + dataSource.stringParam())
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

export function handleChapterMetadata(content: Bytes): void {
  const out = new ChapterMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
    ])
    out.save()
  }
}

export function handleBookMetadata(content: Bytes): void {
  const out = new BookMetadata('ipfs://' + dataSource.stringParam())
  const ipfs = json.fromBytes(content).toObject()
  if (ipfs) {
    copyValues(out, [
      new KVPair('image', ipfs.get('cover')),
      new KVPair('name', ipfs.get('name')),
      new KVPair('description', ipfs.get('description')),
      new KVPair('externalURL', ipfs.get('external_url')),
      new KVPair('slug', ipfs.get('slug')),
    ])

    const cats = mapCategories(ipfs.get('categories'))
    if (cats.ok) {
      out.categories =
        cats.result != null && cats.result.names != null
          ? cats.result.names()
          : null
    }
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

    const map = mapCategories(ipfs.get('categories'))
    if (map.ok && map.result && map.result.names) {
      out.categories = map.result.names()
    }

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

    const map = mapCategories(ipfs.get('categories'))
    if (map.ok && map.result && map.result.names) {
      out.categories = map.result.names()
    }
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
