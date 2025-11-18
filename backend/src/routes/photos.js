import express from 'express';
import photoService from '../services/photoService.js';

const router = express.Router();

/**
 * GET /api/photos/stats
 * Get statistics about the photo collection
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await photoService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting photo stats:', error);
    res.status(500).json({ error: 'Failed to get photo stats' });
  }
});

/**
 * GET /api/photos/list
 * Get a list of photos (optionally random selection)
 */
router.get('/list', async (req, res) => {
  try {
    const count = parseInt(req.query.count) || 50;
    const random = req.query.random === 'true';

    // Check if photos path is accessible
    const accessible = await photoService.isAccessible();
    if (!accessible) {
      return res.status(503).json({
        error: 'Photos directory not accessible',
        message: 'Please check that photos are available at /app/photos in the container',
        path: photoService.photoPath
      });
    }

    const photos = random
      ? await photoService.getRandomPhotos(count)
      : await photoService.getAllPhotos();

    res.json({
      count: photos.length,
      photos: photos.map(p => ({
        filename: p.filename,
        url: `/api/photos/image/${encodeURIComponent(p.path)}`
      }))
    });
  } catch (error) {
    console.error('Error listing photos:', error);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

/**
 * GET /api/photos/image/:path
 * Serve a specific photo file
 */
router.get('/image/*', async (req, res) => {
  try {
    // Get the path after /api/photos/image/
    const relativePath = req.params[0];

    if (!relativePath) {
      return res.status(400).json({ error: 'No photo path provided' });
    }

    const decodedPath = decodeURIComponent(relativePath);
    const photoPath = photoService.getPhotoPath(decodedPath);

    console.log(`Serving photo: ${decodedPath} -> ${photoPath}`);

    // Send the file with explicit options
    res.sendFile(photoPath, {
      root: '/',
      dotfiles: 'deny',
      headers: {
        'Content-Type': 'image/jpeg', // Will be overridden by Express based on file extension
        'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
      }
    }, (err) => {
      if (err) {
        console.error('Error sending photo:', photoPath, err.message);
        if (!res.headersSent) {
          res.status(404).json({ error: 'Photo not found', path: decodedPath });
        }
      }
    });
  } catch (error) {
    console.error('Error serving photo:', error);
    res.status(500).json({ error: 'Failed to serve photo' });
  }
});

export default router;
