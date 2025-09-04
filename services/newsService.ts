import type { NewsArticle } from '../types';

/**
 * Fetches the latest news articles for a given cryptocurrency symbol.
 * @param baseCoin The base currency symbol (e.g., 'BTC').
 * @returns A promise that resolves to an array of news articles.
 */
export const fetchNews = async (baseCoin: string): Promise<NewsArticle[]> => {
  console.log(`Fetching news for ${baseCoin}...`);
  // Using CryptoCompare's public news API
  const url = `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${baseCoin.toUpperCase()}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`News API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (data.Type !== 100 || !Array.isArray(data.Data)) {
      throw new Error('Invalid or unexpected response from news API.');
    }

    // Map the API response to the NewsArticle format
    const newsData: NewsArticle[] = data.Data.map((article: any) => ({
      id: article.id,
      title: article.title,
      source: article.source,
      publishedOn: article.published_on,
      url: article.url,
      imageUrl: article.imageurl,
    }));

    return newsData;
  } catch (error) {
    console.error(`Error fetching news for ${baseCoin}:`, error);
    // Don't throw a user-facing error, as news is a non-critical feature.
    // The UI will handle the empty state.
    return [];
  }
};
