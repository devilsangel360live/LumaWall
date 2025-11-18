import Parser from 'rss-parser';
import crypto from 'crypto';
import db from '../config/database.js';

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail'],
      ['content:encoded', 'contentEncoded'],
      ['description', 'description']
    ]
  }
});

class NewsService {
  constructor() {
    this.feeds = [
      // Politics
      { name: 'Politico Politics', category: 'politics', url: 'https://rss.politico.com/politics-news.xml' },
      { name: 'CNN Politics', category: 'politics', url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss' },
      { name: 'BBC Politics', category: 'politics', url: 'https://feeds.bbci.co.uk/news/politics/rss.xml' },

      // Top News
      { name: 'CNN Top Stories', category: 'top', url: 'http://rss.cnn.com/rss/cnn_topstories.rss' },
      { name: 'Reuters', category: 'top', url: 'https://news.google.com/rss/search?q=site%3Areuters.com&hl=en-US&gl=US&ceid=US%3Aen' },
      { name: 'BBC News', category: 'top', url: 'https://feeds.bbci.co.uk/news/rss.xml' },

      // Tech
      { name: 'TechRadar', category: 'tech', url: 'https://www.techradar.com/rss' },
      { name: 'Engadget', category: 'tech', url: 'https://www.engadget.com/rss.xml' },
      { name: 'TechCrunch', category: 'tech', url: 'https://techcrunch.com/feed/' },
      { name: 'NPR Technology', category: 'tech', url: 'https://feeds.npr.org/1019/rss.xml' },

      // Games
      { name: 'Polygon', category: 'games', url: 'https://www.polygon.com/rss/index.xml' },
      { name: 'Rock Paper Shotgun', category: 'games', url: 'https://www.rockpapershotgun.com/feed' },

      // Sports
      { name: 'ESPN NFL', category: 'sports', url: 'https://www.espn.com/espn/rss/nfl/news' },
      { name: 'ESPN NBA', category: 'sports', url: 'https://www.espn.com/espn/rss/nba/news' },
      { name: 'Tennis.com', category: 'sports', url: 'https://www.tennis.com/roots/rss-feeds/news/' },
      { name: 'ESPN Cricket', category: 'sports', url: 'https://www.espncricinfo.com/rss/content/story/feeds/0.xml' }
    ];

    this.initializeFeeds();
  }

  /**
   * Initialize feeds in database
   */
  initializeFeeds() {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO news_feeds (name, category, url)
      VALUES (?, ?, ?)
    `);

    for (const feed of this.feeds) {
      stmt.run(feed.name, feed.category, feed.url);
    }

    console.log(`📰 Initialized ${this.feeds.length} news feeds`);
  }

  /**
   * Generate unique ID for article (based on URL)
   */
  generateArticleId(link) {
    return crypto.createHash('md5').update(link).digest('hex');
  }

  /**
   * Extract image URL from RSS item
   */
  extractImageUrl(item) {
    // Try various image fields
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }
    if (item.media && item.media.$) {
      return item.media.$.url;
    }
    if (item.thumbnail && item.thumbnail.$) {
      return item.thumbnail.$.url;
    }

    // Try to extract from content/description
    const content = item.contentEncoded || item.description || '';
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }

    return null;
  }

  /**
   * Clean HTML from description
   */
  cleanDescription(html) {
    if (!html) return '';

    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, '');

    // Decode HTML entities
    text = text.replace(/&quot;/g, '"')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&nbsp;/g, ' ')
               .replace(/&#39;/g, "'");

    // Trim and limit length
    text = text.trim();
    if (text.length > 300) {
      text = text.substring(0, 297) + '...';
    }

    return text;
  }

  /**
   * Fetch and parse a single RSS feed
   */
  async fetchFeed(feedConfig) {
    try {
      console.log(`📡 Fetching: ${feedConfig.name}`);

      const feed = await parser.parseURL(feedConfig.url);
      const articles = [];

      // Get feed ID from database
      const feedRecord = db.prepare('SELECT id FROM news_feeds WHERE url = ?').get(feedConfig.url);
      if (!feedRecord) {
        console.error(`Feed not found in database: ${feedConfig.url}`);
        return [];
      }

      // Process items (limit to 20 most recent)
      const items = feed.items.slice(0, 20);

      for (const item of items) {
        const articleId = this.generateArticleId(item.link);
        const imageUrl = this.extractImageUrl(item);
        const description = this.cleanDescription(item.contentSnippet || item.description);

        articles.push({
          id: articleId,
          feed_id: feedRecord.id,
          category: feedConfig.category,
          title: item.title || 'Untitled',
          description,
          link: item.link,
          pub_date: item.pubDate || item.isoDate || new Date().toISOString(),
          author: item.creator || item.author || feed.title,
          image_url: imageUrl,
          source: feedConfig.name,
          content: item.contentEncoded || item.content || null,
          raw_data: JSON.stringify(item)
        });
      }

      // Update last_fetched timestamp
      db.prepare('UPDATE news_feeds SET last_fetched = ? WHERE id = ?')
        .run(new Date().toISOString(), feedRecord.id);

      console.log(`✅ ${feedConfig.name}: ${articles.length} articles`);
      return articles;

    } catch (error) {
      console.error(`❌ Error fetching ${feedConfig.name}:`, error.message);
      return [];
    }
  }

  /**
   * Fetch all feeds and update database
   */
  async fetchAllFeeds() {
    console.log('🔄 Fetching all news feeds...');

    try {
      const allArticles = [];

      // Fetch all feeds in parallel
      const results = await Promise.allSettled(
        this.feeds.map(feed => this.fetchFeed(feed))
      );

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
        } else {
          console.error(`Failed to fetch ${this.feeds[index].name}:`, result.reason);
        }
      });

      // Clear old articles and insert new ones
      db.prepare('DELETE FROM news_articles').run();

      const stmt = db.prepare(`
        INSERT OR REPLACE INTO news_articles (
          id, feed_id, category, title, description, link, pub_date,
          author, image_url, source, content, raw_data, fetched_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const now = new Date().toISOString();
      for (const article of allArticles) {
        stmt.run(
          article.id,
          article.feed_id,
          article.category,
          article.title,
          article.description,
          article.link,
          article.pub_date,
          article.author,
          article.image_url,
          article.source,
          article.content,
          article.raw_data,
          now
        );
      }

      console.log(`✅ Stored ${allArticles.length} articles across ${this.feeds.length} feeds`);

      return {
        success: true,
        totalArticles: allArticles.length,
        totalFeeds: this.feeds.length
      };

    } catch (error) {
      console.error('❌ Error fetching news feeds:', error);
      throw error;
    }
  }

  /**
   * Get articles by category
   */
  getArticlesByCategory(category, limit = 20) {
    const articles = db.prepare(`
      SELECT * FROM news_articles
      WHERE category = ?
      ORDER BY pub_date DESC
      LIMIT ?
    `).all(category, limit);

    return articles.map(article => ({
      ...article,
      raw_data: undefined // Don't send raw data to frontend
    }));
  }

  /**
   * Get all articles grouped by category
   */
  getAllArticles() {
    const categories = ['top', 'politics', 'tech', 'games', 'sports'];
    const result = {};

    for (const category of categories) {
      result[category] = this.getArticlesByCategory(category, 20);
    }

    return result;
  }

  /**
   * Get latest top stories (for featured display)
   */
  getTopStories(limit = 5) {
    return db.prepare(`
      SELECT * FROM news_articles
      WHERE category = 'top'
      ORDER BY pub_date DESC
      LIMIT ?
    `).all(limit);
  }

  /**
   * Get feed statistics
   */
  getStats() {
    const totalFeeds = db.prepare('SELECT COUNT(*) as count FROM news_feeds WHERE enabled = 1').get();
    const totalArticles = db.prepare('SELECT COUNT(*) as count FROM news_articles').get();
    const lastFetch = db.prepare('SELECT MAX(last_fetched) as last FROM news_feeds').get();

    const byCategory = db.prepare(`
      SELECT category, COUNT(*) as count
      FROM news_articles
      GROUP BY category
    `).all();

    return {
      totalFeeds: totalFeeds.count,
      totalArticles: totalArticles.count,
      lastFetch: lastFetch.last,
      byCategory: byCategory.reduce((acc, row) => {
        acc[row.category] = row.count;
        return acc;
      }, {})
    };
  }
}

export default new NewsService();
