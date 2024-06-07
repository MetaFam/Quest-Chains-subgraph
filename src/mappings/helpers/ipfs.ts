import { ipfs, json, log } from '@graphprotocol/graph-ts';

class Metadata {
  name: string | null;
  description: string | null;
  imageUrl: string | null;
  animationUrl: string | null;
  externalUrl: string | null;
  mimeType: string | null;
  slug: string | null;
  categories: string[] | null;

  constructor() {
    this.name = null;
    this.description = null;
    this.imageUrl = null;
    this.animationUrl = null;
    this.externalUrl = null;
    this.mimeType = null;
    this.slug = null;
  }
}


function fetchHash(details: string): string {
  let parts = details.split('/');
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

function fetchIpfsData(hash: string) {
  let ipfsData = ipfs.cat(hash);
  if (ipfsData) {
    log.info('IPFS details from hash {}, data {}', [hash, ipfsData.toString()]);
    return json.fromBytes(ipfsData).toObject();
  } else {
    log.warning('could not get IPFS details from hash {}', [hash]);
    return null;
  }
}

function assignMetadataValue(data: any, key: string): string | null {
  let value = data.get(key);
  return value != null && !value.isNull() ? value.toString() : null;
}

function assignMetadataCategories(data: any): string[] | null {
  let categories = data.get('categories');
  if (categories != null && !categories.isNull()) {
    let categoryArray = categories.toArray();
    return categoryArray.map(category => category.toString());
  }
  return null;
}

export function fetchMetadata(details: string): Metadata {
  let metadata = new Metadata();
  if (details == '') return metadata;

  let hash = fetchHash(details);
  if (hash != '') {
    let data = fetchIpfsData(hash);
    if (data) {
      metadata.name = assignMetadataValue(data, 'name');
      metadata.description = assignMetadataValue(data, 'description');
      metadata.imageUrl = assignMetadataValue(data, 'image_url');
      metadata.animationUrl = assignMetadataValue(data, 'animation_url');
      metadata.externalUrl = assignMetadataValue(data, 'external_url');
      metadata.mimeType = assignMetadataValue(data, 'mime_type');
      metadata.slug = assignMetadataValue(data, 'slug');
      metadata.categories = assignMetadataCategories(data);
    }
  }

  return metadata;
}
