import Parser from 'rss-parser';

const parser = new Parser({
  customFields: {
    item: [
      ['enclosure', 'enclosure'],
      ['media:content', 'media'],
      ['media:thumbnail', 'thumbnail']
    ]
  }
});

class NasaService {
  constructor() {
    this.feedUrl = 'https://www.nasa.gov/rss/dyn/lg_image_of_the_day.rss';
    this.cachedPhoto = null;
    this.lastFetch = null;
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour cache
  }

  /**
   * Extract image URL from RSS item
   */
  extractImageUrl(item) {
    // Try enclosure first (most common for NASA)
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }

    // Try media content
    if (item.media && item.media.$) {
      return item.media.$.url;
    }

    // Try thumbnail
    if (item.thumbnail && item.thumbnail.$) {
      return item.thumbnail.$.url;
    }

    // Try to extract from content/description
    const content = item.content || item.description || '';
    const imgMatch = content.match(/<img[^>]+src="([^">]+)"/);
    if (imgMatch) {
      return imgMatch[1];
    }

    return null;
  }

  /**
   * Fetch NASA Image of the Day
   */
  async fetchImageOfTheDay() {
    // Return cached photo if still fresh
    const now = Date.now();
    if (this.cachedPhoto && this.lastFetch && (now - this.lastFetch < this.cacheExpiry)) {
      console.log(' Returning cached NASA photo');
      return this.cachedPhoto;
    }

    try {
      console.log(' Fetching NASA Image of the Day...');
      const feed = await parser.parseURL(this.feedUrl);

      if (!feed.items || feed.items.length === 0) {
        throw new Error('No items in NASA RSS feed');
      }

      const latestItem = feed.items[0];
      const imageUrl = this.extractImageUrl(latestItem);

      if (!imageUrl) {
        throw new Error('Could not extract image URL from NASA feed');
      }

      this.cachedPhoto = {
        title: latestItem.title || 'NASA Image of the Day',
        description: latestItem.contentSnippet || latestItem.description || '',
        imageUrl: imageUrl,
        link: latestItem.link,
        pubDate: latestItem.pubDate || latestItem.isoDate,
        fetchedAt: new Date().toISOString()
      };

      this.lastFetch = now;
      console.log(' NASA Photo fetched:', this.cachedPhoto.title);

      return this.cachedPhoto;

    } catch (error) {
      console.error(' Error fetching NASA photo:', error.message);

      // Return cached photo if available, even if expired
      if (this.cachedPhoto) {
        console.log(' Returning expired cached photo due to fetch error');
        return this.cachedPhoto;
      }

      throw error;
    }
  }

  /**
   * Get cached photo (if available)
   */
  getCachedPhoto() {
    return this.cachedPhoto;
  }
}

export default new NasaService();
