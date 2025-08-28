export class Metadata {
  name: string | null = null
  description: string | null = null
  imageUrl: string | null = null
  animationUrl: string | null = null
  externalUrl: string | null = null
  mimeType: string | null = null
  slug: string | null = null
  categories: string[] | null = null
}

export function stripProtocol(details: string): string {
  if (details.toLowerCase().trim().startsWith('ipfs://')) {
    details = details.trim().slice(7)
  }
  return details
}
