import express from 'express';
import newsService from '../services/newsService.js';

const router = express.Router();

/**
 * POST /api/news/sync
 * Manually trigger news fetch
 */
router.post('/sync', async (req, res) => {
  try {
    const result = await newsService.fetchAllFeeds();
    res.json(result);
  } catch (error) {
    console.error('Error syncing news:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/stats
 * Get news statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = newsService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting news stats:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/articles
 * Get all articles grouped by category
 */
router.get('/articles', (req, res) => {
  try {
    const articles = newsService.getAllArticles();
    res.json(articles);
  } catch (error) {
    console.error('Error getting articles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/category/:category
 * Get articles for a specific category
 */
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const limit = parseInt(req.query.limit) || 20;
    const articles = newsService.getArticlesByCategory(category, limit);
    res.json({ category, articles });
  } catch (error) {
    console.error('Error getting category articles:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/top
 * Get top stories (featured)
 */
router.get('/top', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const articles = newsService.getTopStories(limit);
    res.json({ articles });
  } catch (error) {
    console.error('Error getting top stories:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
