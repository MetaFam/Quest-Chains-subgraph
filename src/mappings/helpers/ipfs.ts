import { ipfs, json, JSONValue, log, TypedMap } from '@graphprotocol/graph-ts';

export class Metadata {
  name: string | null = null;
  description: string | null = null;
  imageUrl: string | null = null;
  animationUrl: string | null = null;
  externalUrl: string | null = null;
  mimeType: string | null = null;
  slug: string | null = null;
  categories: string[] | null = null;

  static from(detailsURL: string): Metadata {
    const metadata = new Metadata();
    const path = stripProtocol(detailsURL);
    if (path != null) {
      const data = fetchIPFSData(path);
      if (data != null) {
        metadata.name = getString(data, 'name');
        metadata.description = getString(data, 'description');
        metadata.imageUrl = getString(data, 'image_url');
        metadata.animationUrl = getString(data, 'animation_url');
        metadata.externalUrl = getString(data, 'external_url');
        metadata.mimeType = getString(data, 'mime_type');
        metadata.slug = getString(data, 'slug');
        metadata.categories = getArray(data, 'categories');
      }
    }
    return metadata;
  }
}

function stripProtocol(details: string): string {
  if (details.toLowerCase().startsWith('ipfs://')) {
    details = details.slice(7);
  }
  return details;
}

function fetchIPFSData(path: string): TypedMap<string, JSONValue> | null {
  const raw = ipfs.cat(path);
  if (raw) {
    log.info('Details from "{}": {}', [path, raw.toString()]);
    return json.fromBytes(raw).toObject();
  }
  log.warning('Couldn’t get details from "{}"', [path]);
  return null;
}

function getString(
  data: TypedMap<string, JSONValue>,
  key: string,
): string | null {
  const value = data.get(key);
  return value != null && !value.isNull() ? value.toString() : null;
}

function getArray(
  data: TypedMap<string, JSONValue>,
  key: string,
): string[] | null {
  const value = data.get(key);
  if (value != null && !value.isNull()) {
    const array = value.toArray();
    return array.map<string>((elem: JSONValue) => elem.toString());
  }
  return null;
}
