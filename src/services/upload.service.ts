import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload avatar image to Cloudinary
 * Returns secure URL for the uploaded image
 * Pure function (side effects isolated to Cloudinary API)
 */
export function uploadAvatar(
  file: Express.Multer.File
): Promise<{ url: string }> {
  return new Promise((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: 'tweeter/avatars',
        transformation: [{ width: 400, height: 400, crop: 'fill' }],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve({ url: result.secure_url });
        } else {
          reject(new Error('Upload failed: no result returned'));
        }
      }
    );

    Readable.from(file.buffer).pipe(upload);
  });
}

/**
 * Validate image file format and size
 * Pure function - returns boolean
 */
export function validateImageFile(file: Express.Multer.File): boolean {
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  return validMimeTypes.includes(file.mimetype) && file.size <= maxSize;
}
