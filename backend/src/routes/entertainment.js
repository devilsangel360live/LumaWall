import express from 'express';
import entertainmentService from '../services/entertainmentService.js';

const router = express.Router();

/**
 * GET /api/entertainment/all
 * Get all entertainment data (movies, history, star chart)
 */
router.get('/all', async (req, res) => {
  try {
    const data = await entertainmentService.fetchAllData();
    res.json(data);
  } catch (error) {
    console.error('Error getting entertainment data:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/entertainment/movies
 * Get movies currently in theaters
 */
router.get('/movies', async (req, res) => {
  try {
    const movies = await entertainmentService.fetchNowPlayingMovies();
    res.json({ movies });
  } catch (error) {
    console.error('Error getting movies:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/entertainment/history
 * Get today in history events
 */
router.get('/history', async (req, res) => {
  try {
    const history = await entertainmentService.fetchTodayInHistory();
    res.json(history);
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/entertainment/star-chart
 * Get current star chart
 */
router.get('/star-chart', async (req, res) => {
  try {
    const starChart = await entertainmentService.fetchStarChart();
    res.json(starChart);
  } catch (error) {
    console.error('Error getting star chart:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
