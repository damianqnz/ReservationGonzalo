import { v2 as cloudinary } from 'cloudinary'
import { getImageUrl } from './cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

/**
 * Uploads an image buffer to Cloudinary.
 * Returns the publicId (relative path in Cloudinary) and a constructed display URL.
 */
export async function uploadImage(
  buffer: Buffer,
  folder: string,
  customPublicId?: string
): Promise<{ publicId: string; url: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        ...(customPublicId ? { public_id: customPublicId } : {}),
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error('Cloudinary upload failed'))
          return
        }
        resolve({
          publicId: result.public_id,
          url: getImageUrl(result.public_id),
        })
      }
    )
    stream.write(buffer)
    stream.end()
  })
}

/**
 * Deletes an image from Cloudinary by publicId.
 */
export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
