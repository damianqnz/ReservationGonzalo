export interface ImageOptions {
  width?: number
  height?: number
  quality?: number | 'auto'
}

/**
 * Builds a Cloudinary image URL from a publicId.
 * Applies f_auto and q_auto by default for optimal delivery.
 * Backward compat: if publicId starts with 'http', returns it as-is
 * (handles existing Unsplash test images in the DB).
 */
export function getImageUrl(publicId: string, options: ImageOptions = {}): string {
  if (!publicId) return ''
  if (publicId.startsWith('http')) return publicId

  // Use NEXT_PUBLIC_ for client-side access, fall back to server-side env for Node.js
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME

  if (!cloudName) return publicId

  const transforms: string[] = []
  if (options.width) transforms.push(`w_${options.width}`)
  if (options.height) transforms.push(`h_${options.height}`)
  transforms.push('f_auto')
  transforms.push(`q_${options.quality ?? 'auto'}`)

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms.join(',')}/${publicId}`
}

/**
 * Resolves the best display URL for an image record.
 * Prefers Cloudinary URL built from publicId (if it looks like a real Cloudinary path).
 * Falls back to the stored url field for legacy/seed images.
 */
export function resolveImageUrl(
  image: { url: string; publicId: string },
  options: ImageOptions = {}
): string {
  // A real Cloudinary publicId contains a slash (e.g. "properties/chiado/abc123").
  // Old seed publicIds are simple strings without a slash (e.g. "property1_cover")
  // and the real URL is the Unsplash url field.
  if (image.publicId && image.publicId.includes('/')) {
    return getImageUrl(image.publicId, options)
  }
  return image.url
}
