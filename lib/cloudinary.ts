import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** Upload a raw buffer to Cloudinary and return the secure URL. */
export async function uploadImage(buffer: Buffer, originalName: string): Promise<string> {
  const ext = originalName.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_FORMATS.includes(ext)) {
    throw new Error(`Unsupported image format: ${ext}. Allowed: ${ALLOWED_FORMATS.join(', ')}`);
  }
  if (buffer.byteLength > MAX_BYTES) {
    throw new Error('Image exceeds 5 MB limit');
  }

  return new Promise<string>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'reviewiq/queries', resource_type: 'image', allowed_formats: ALLOWED_FORMATS },
      (err, result) => {
        if (err || !result) reject(err ?? new Error('Upload failed'));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
}
