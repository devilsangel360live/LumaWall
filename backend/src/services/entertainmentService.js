// Note: fetch is built-in for Node 18+

class EntertainmentService {
  constructor() {
    // TMDB Configuration - lazy loaded
    this.tmdbBaseUrl = 'https://api.themoviedb.org/3';
    this.tmdbImageBaseUrl = 'https://image.tmdb.org/t/p/w500';

    // Astronomy API Configuration - lazy loaded
    this.astronomyBaseUrl = 'https://api.astronomyapi.com/api/v2';

    // Cache
    this.moviesCache = null;
    this.moviesCacheExpiry = null;
    this.moviesCacheTime = 6 * 60 * 60 * 1000; // 6 hours

    this.historyCache = null;
    this.historyCacheDate = null;

    this.starChartCache = null;
    this.starChartCacheExpiry = null;
    this.starChartCacheTime = 60 * 60 * 1000; // 1 hour
  }

  // Lazy load configuration from env vars
  get tmdbApiKey() {
    return process.env.TMDB_API_KEY;
  }

  get astronomyAppId() {
    return process.env.ASTRONOMY_APP_ID;
  }

  get astronomyAppSecret() {
    return process.env.ASTRONOMY_APP_SECRET;
  }

  get latitude() {
    return process.env.LOCATION_LATITUDE || '40.7128';
  }

  get longitude() {
    return process.env.LOCATION_LONGITUDE || '-74.0060';
  }

  /**
   * Fetch movies currently in theaters from TMDB
   */
  async fetchNowPlayingMovies() {
    const now = Date.now();

    // Return cached data if fresh
    if (this.moviesCache && this.moviesCacheExpiry && now < this.moviesCacheExpiry) {
      console.log('  Returning cached movies');
      return this.moviesCache;
    }

    try {
      if (!this.tmdbApiKey) {
        throw new Error('TMDB_API_KEY not configured');
      }

      console.log(' Fetching now playing movies from TMDB...');

      const response = await fetch(
        `${this.tmdbBaseUrl}/movie/now_playing?api_key=${this.tmdbApiKey}&language=en-US&page=1&region=US`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform and limit to top 12 movies
      const movies = data.results.slice(0, 12).map(movie => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        posterPath: movie.poster_path ? `${this.tmdbImageBaseUrl}${movie.poster_path}` : null,
        backdropPath: movie.backdrop_path ? `${this.tmdbImageBaseUrl}${movie.backdrop_path}` : null,
        releaseDate: movie.release_date,
        rating: movie.vote_average,
        voteCount: movie.vote_count,
        popularity: movie.popularity
      }));

      this.moviesCache = movies;
      this.moviesCacheExpiry = now + this.moviesCacheTime;

      console.log(` Fetched ${movies.length} movies`);
      return movies;

    } catch (error) {
      console.error(' Error fetching movies:', error.message);

      // Return cached data if available, even if expired
      if (this.moviesCache) {
        console.log('  Returning expired cached movies');
        return this.moviesCache;
      }

      throw error;
    }
  }

  /**
   * Fetch Today in History from Wikipedia
   */
  async fetchTodayInHistory() {
    const today = new Date();
    const month = today.getMonth() + 1; // 1-12
    const day = today.getDate(); // 1-31
    const todayKey = `${month}-${day}`;

    // Return cached data if same day
    if (this.historyCache && this.historyCacheDate === todayKey) {
      console.log(' Returning cached history');
      return this.historyCache;
    }

    try {
      console.log(` Fetching Today in History for ${month}/${day}...`);

      const response = await fetch(
        `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/all/${month}/${day}`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'LumaWall/1.0 (Smart Display Application)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Wikipedia API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Get events, births, and deaths
      const events = (data.events || []).slice(0, 5).map(event => ({
        year: event.year,
        text: event.text,
        type: 'event'
      }));

      const births = (data.births || []).slice(0, 2).map(birth => ({
        year: birth.year,
        text: birth.text,
        type: 'birth'
      }));

      const deaths = (data.deaths || []).slice(0, 2).map(death => ({
        year: death.year,
        text: death.text,
        type: 'death'
      }));

      const history = {
        date: `${month}/${day}`,
        events: [...events, ...births, ...deaths]
      };

      this.historyCache = history;
      this.historyCacheDate = todayKey;

      console.log(` Fetched ${history.events.length} historical events`);
      return history;

    } catch (error) {
      console.error(' Error fetching history:', error.message);

      // Return cached data if available
      if (this.historyCache) {
        console.log('  Returning cached history');
        return this.historyCache;
      }

      throw error;
    }
  }

  /**
   * Fetch star chart from AstronomyAPI
   */
  async fetchStarChart() {
    const now = Date.now();

    // Return cached chart if fresh
    if (this.starChartCache && this.starChartCacheExpiry && now < this.starChartCacheExpiry) {
      console.log(' Returning cached star chart');
      return this.starChartCache;
    }

    try {
      if (!this.astronomyAppId || !this.astronomyAppSecret) {
        throw new Error('AstronomyAPI credentials not configured');
      }

      console.log(' Fetching star chart from AstronomyAPI...');

      // Create authorization hash
      const auth = Buffer.from(`${this.astronomyAppId}:${this.astronomyAppSecret}`).toString('base64');

      // Current date and time
      const date = new Date();
      const requestBody = {
        style: 'default',
        observer: {
          latitude: parseFloat(this.latitude),
          longitude: parseFloat(this.longitude),
          date: date.toISOString().split('T')[0] // YYYY-MM-DD
        },
        view: {
          type: 'constellation',
          parameters: {
            constellation: 'ori' // Can be changed or made dynamic
          }
        }
      };

      const response = await fetch(
        `${this.astronomyBaseUrl}/studio/star-chart`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AstronomyAPI error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      const starChart = {
        imageUrl: data.data.imageUrl,
        timestamp: date.toISOString(),
        location: {
          latitude: this.latitude,
          longitude: this.longitude
        }
      };

      this.starChartCache = starChart;
      this.starChartCacheExpiry = now + this.starChartCacheTime;

      console.log(' Star chart fetched successfully');
      return starChart;

    } catch (error) {
      console.error(' Error fetching star chart:', error.message);

      // Return cached data if available
      if (this.starChartCache) {
        console.log('  Returning cached star chart');
        return this.starChartCache;
      }

      throw error;
    }
  }

  /**
   * Get all entertainment data at once
   */
  async fetchAllData() {
    try {
      const [movies, history] = await Promise.allSettled([
        this.fetchNowPlayingMovies(),
        this.fetchTodayInHistory()
      ]);

      return {
        movies: movies.status === 'fulfilled' ? movies.value : null,
        history: history.status === 'fulfilled' ? history.value : null,
        location: {
          latitude: parseFloat(this.latitude),
          longitude: parseFloat(this.longitude)
        },
        errors: {
          movies: movies.status === 'rejected' ? movies.reason.message : null,
          history: history.status === 'rejected' ? history.reason.message : null
        }
      };
    } catch (error) {
      console.error(' Error fetching entertainment data:', error);
      throw error;
    }
  }
}

export default new EntertainmentService();
