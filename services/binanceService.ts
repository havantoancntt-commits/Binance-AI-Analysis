import type { PriceDataPoint } from '../types';

// Binance API documentation for kline/candlestick data:
// https://github.com/binance/binance-spot-api-docs/blob/master/rest-api.md#klinecandlestick-data
// The response is an array of arrays, where each inner array represents a kline:
// [
//   [
//     1499040000000,      // Open time (timestamp)
//     "4261.48000000",    // Open price
//     "4313.62000000",    // High price
//     "4261.32000000",    // Low price
//     "4308.83000000",    // Close price (index 4)
//     "100.00000000",     // Volume (index 5)
//     ...
//   ]
// ]

/**
 * Fetches historical daily price and volume data for a given cryptocurrency pair from the Binance API.
 * @param coinPair The coin pair to fetch data for (e.g., 'BTC/USDT').
 * @param days The number of days of historical data to retrieve (default: 365).
 * @returns A promise that resolves to an array of price data points including volume.
 */
export const fetchHistoricalData = async (coinPair: string, days: number = 365): Promise<PriceDataPoint[]> => {
  console.log(`Fetching real historical data for ${coinPair} from Binance...`);
  
  const symbol = coinPair.replace('/', '').toUpperCase();
  const interval = '1d'; // 1-day interval for daily data
  const limit = days;
  
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})); // Catch cases where body is not JSON
      throw new Error(errorData.msg || `API request failed with status ${response.status}`);
    }

    const data: any[] = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`No historical data returned for symbol ${symbol}.`);
    }

    // Map the Binance API response to the PriceDataPoint format used by the app
    const priceData: PriceDataPoint[] = data.map(kline => ({
      date: new Date(kline[0]).toISOString().split('T')[0],
      price: parseFloat(kline[4]), // Close price is at index 4
      volume: parseFloat(kline[5]), // Volume is at index 5
    }));

    return priceData;
  } catch (error: any) {
    console.error(`Error fetching historical data for ${coinPair}:`, error);
    
    // Provide user-friendly error messages in Vietnamese
    if (error.message.includes('Invalid symbol') || error.message.includes('400')) {
        throw new Error(`Cặp ${coinPair} không hợp lệ hoặc không được tìm thấy trên Binance.`);
    }
     if (error.message.includes('No historical data')) {
        throw new Error(`Không có đủ dữ liệu lịch sử cho cặp ${coinPair} để phân tích.`);
    }
    throw new Error(`Không thể lấy dữ liệu từ Binance. Vui lòng kiểm tra kết nối mạng và thử lại.`);
  }
};