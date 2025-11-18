import express from 'express';
import nasaService from '../services/nasaService.js';

const router = express.Router();

/**
 * GET /api/nasa/photo
 * Get NASA Image of the Day
 */
router.get('/photo', async (req, res) => {
  try {
    const photo = await nasaService.fetchImageOfTheDay();
    res.json(photo);
  } catch (error) {
    console.error('Error getting NASA photo:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
