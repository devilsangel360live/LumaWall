import fs from 'fs/promises';
import path from 'path';

/**
 * Service to handle photo retrieval from mounted NAS drive
 */
class PhotoService {
  constructor() {
    // In Docker, photos are mounted at /app/photos via docker-compose volume
    // For local dev, use PHOTOS_MOUNT_PATH environment variable
    this.photoPath = process.env.PHOTOS_MOUNT_PATH || '/app/photos';
    // Note: HEIC/HEIF formats require conversion and are not supported by browsers
    this.supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

    console.log(`PhotoService initialized with path: ${this.photoPath}`);
  }

  /**
   * Check if the photo mount path is accessible
   */
  async isAccessible() {
    try {
      await fs.access(this.photoPath);
      return true;
    } catch (error) {
      console.error(`Photos mount path not accessible: ${this.photoPath}`, error.message);
      return false;
    }
  }

  /**
   * Recursively get all photo files from the directory
   */
  async getAllPhotos(dir = this.photoPath, fileList = []) {
    try {
      const files = await fs.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dir, file.name);

        if (file.isDirectory()) {
          // Skip hidden directories and common exclusions
          if (!file.name.startsWith('.') && !file.name.startsWith('@')) {
            await this.getAllPhotos(filePath, fileList);
          }
        } else {
          // Skip hidden files (macOS ._ metadata files, .DS_Store, etc.)
          if (file.name.startsWith('.') || file.name.startsWith('._')) {
            continue;
          }

          const ext = path.extname(file.name).toLowerCase();
          if (this.supportedFormats.includes(ext)) {
            // Store relative path from photos root
            const relativePath = path.relative(this.photoPath, filePath);
            fileList.push({
              filename: file.name,
              path: relativePath,
              ext: ext
            });
          }
        }
      }

      return fileList;
    } catch (error) {
      console.error('Error reading photos:', error);
      throw new Error(`Failed to read photos: ${error.message}`);
    }
  }

  /**
   * Get a random selection of photos
   */
  async getRandomPhotos(count = 50) {
    const allPhotos = await this.getAllPhotos();

    if (allPhotos.length === 0) {
      return [];
    }

    // Shuffle and take requested count
    const shuffled = allPhotos.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, allPhotos.length));
  }

  /**
   * Get the absolute path for a photo file
   */
  getPhotoPath(relativePath) {
    return path.join(this.photoPath, relativePath);
  }

  /**
   * Get stats for the photos directory
   */
  async getStats() {
    try {
      const accessible = await this.isAccessible();

      if (!accessible) {
        return {
          accessible: false,
          path: this.photoPath,
          totalPhotos: 0
        };
      }

      const allPhotos = await this.getAllPhotos();

      return {
        accessible: true,
        path: this.photoPath,
        totalPhotos: allPhotos.length
      };
    } catch (error) {
      return {
        accessible: false,
        path: this.photoPath,
        totalPhotos: 0,
        error: error.message
      };
    }
  }
}

export default new PhotoService();
