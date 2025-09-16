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
type ValidTimeframe = '1D' | '7D' | '1M' | '3M' | '1Y';

const TIMEFRAME_PARAMS: Record<ValidTimeframe, { interval: string; limit: number }> = {
  '1D': { interval: '5m', limit: 288 }, // 24h * 60m / 5m = 288 data points
  '7D': { interval: '30m', limit: 336 }, // 7d * 24h * 60m / 30m = 336 data points
  '1M': { interval: '2h', limit: 360 }, // 30d * 24h / 2h = 360 data points
  '3M': { interval: '1d', limit: 90 }, // 90 days of daily data
  '1Y': { interval: '1d', limit: 365 },
};

/**
 * Fetches historical price and volume data for a given cryptocurrency pair from the Binance API based on a specified timeframe.
 * @param coinPair The coin pair to fetch data for (e.g., 'BTC/USDT').
 * @param timeframe The timeframe for the data ('1D', '7D', '1M', '1Y').
 * @returns A promise that resolves to an array of price data points including volume.
 */
export const fetchHistoricalData = async (coinPair: string, timeframe: ValidTimeframe): Promise<PriceDataPoint[]> => {
  console.log(`Fetching real historical data for ${coinPair} (${timeframe}) from Binance...`);
  
  const symbol = coinPair.replace('/', '').toUpperCase();
  const { interval, limit } = TIMEFRAME_PARAMS[timeframe];
  
  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
        if (response.status === 400 || response.status === 404) {
            throw new Error(`Cặp giao dịch '${coinPair}' không hợp lệ hoặc không được tìm thấy trên Binance. Vui lòng kiểm tra lại.`);
        }
        if (response.status === 429) {
            throw new Error('Bạn đã đạt đến giới hạn yêu cầu API của Binance. Vui lòng đợi một lát rồi thử lại.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.msg || `Yêu cầu API Binance thất bại với trạng thái ${response.status}`);
    }

    const data: any[] = await response.json();
    
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(`Không có đủ dữ liệu lịch sử cho cặp ${coinPair} để phân tích.`);
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
    // Re-throw the specific error from the try block or a generic one
    throw new Error(error.message || `Không thể lấy dữ liệu từ Binance. Vui lòng kiểm tra kết nối mạng và thử lại.`);
  }
};
