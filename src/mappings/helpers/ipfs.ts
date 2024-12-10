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
    if (!!path) {
      const data = fetchIPFSData(path);
      if (!!data) {
        [
          'name',
          'description',
          'image_url',
          'animation_url',
          'external_url',
          'mime_type',
          'slug',
        ].forEach(key => {
          metadata[snakeToCamel(key)] = getString(data, key);
        });
        metadata.categories = getArray(data, 'categories');
      }
    }
    return metadata;
  }
}

function stripProtocol(details: string): string | null {
  const match = Array.from(
    details.match(new RegExp('^(ipfs://)?(.*)$', 'i')) || [],
  );
  return match[1] || null;
}

function fetchIPFSData(path: string): TypedMap<string, JSONValue> | null {
  const raw = ipfs.cat(path);
  if (raw) {
    log.info(`Details from "${path}": ${raw}`, []);
    return json.fromBytes(raw).toObject();
  }
  log.warning(`Couldn't get details from "${path}"`, []);
  return null;
}

function getString(data: any, key: string): string | null {
  const value = data.get(key);
  return value != null && !value.isNull() ? value.toString() : null;
}

function getArray(data: any, key: string): string[] | null {
  const value = data.get(key);
  if (value != null && !value.isNull()) {
    const array = value.toArray();
    return array.map(elem => elem.toString());
  }
  return null;
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/gi, (_, char) => char.toUpperCase());
}
