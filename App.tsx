import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import type { PriceDataPoint, AnalysisResult, TickerData, NewsArticle, Timeframe, DelistingCoin } from './types';
import { AppStatus } from './types';
import { fetchAIAnalysis, fetchDelistingWatchlist } from './services/geminiService';
import { fetchHistoricalData } from './services/binanceService';
import { fetchNews } from './services/newsService';
import PriceChart from './components/PriceChart';
import AnalysisDisplay from './components/AnalysisDisplay';
import Disclaimer from './components/Disclaimer';
import SupportProject from './components/PriceAlert';
import NewsFeed from './components/NewsFeed';
import DashboardSkeleton from './components/DashboardSkeleton';
import DelistingWatchlist from './components/DelistingWatchlist';
import { COIN_PAIRS } from './constants';
import { XCircleIcon, ArrowPathIcon, CpuChipIcon } from './components/Icons';

interface AppState {
  status: AppStatus;
  coinInput: string;
  analyzedCoin: string | null;
  priceData: PriceDataPoint[];
  analysis: AnalysisResult | null;
  tickerData: TickerData | null;
  news: NewsArticle[];
  isNewsLoading: boolean;
  isAnalysisLoading: boolean;
  error: string | null;
  timeframe: Timeframe;
  isChartLoading: boolean;
  analysisCache: Record<string, AnalysisResult>;
  delistingWatchlist: DelistingCoin[];
  isDelistingWatchlistLoading: boolean;
}

type AppAction =
  | { type: 'START_ANALYSIS'; payload: string }
  | { type: 'SET_PRICE_DATA'; payload: PriceDataPoint[] }
  | { type: 'SET_ANALYSIS_AND_NEWS'; payload: { analysis: AnalysisResult; news: NewsArticle[]; coin: string } }
  | { type: 'USE_CACHED_ANALYSIS'; payload: { analysis: AnalysisResult; coin: string } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'UPDATE_TICKER'; payload: TickerData | null }
  | { type: 'SET_COIN_INPUT'; payload: string }
  | { type: 'RESET' }
  | { type: 'SET_TIMEFRAME'; payload: Timeframe }
  | { type: 'SET_CHART_LOADING'; payload: boolean }
  | { type: 'SET_NEWS'; payload: NewsArticle[] }
  | { type: 'SET_DELISTING_WATCHLIST'; payload: DelistingCoin[] }
  | { type: 'SET_DELISTING_WATCHLIST_LOADING'; payload: boolean };

const initialState: AppState = {
  status: AppStatus.Idle,
  coinInput: 'BTC/USDT',
  analyzedCoin: null,
  priceData: [],
  analysis: null,
  tickerData: null,
  news: [],
  isNewsLoading: true,
  isAnalysisLoading: true,
  error: null,
  timeframe: '1Y',
  isChartLoading: false,
  analysisCache: {},
  delistingWatchlist: [],
  isDelistingWatchlistLoading: true,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_ANALYSIS':
      return {
        ...state,
        status: AppStatus.Loading,
        analyzedCoin: action.payload,
        coinInput: action.payload,
        error: null,
        analysis: null,
        priceData: [],
        news: [],
        tickerData: null,
        timeframe: '1Y',
        isChartLoading: true,
        isAnalysisLoading: true,
        isNewsLoading: true,
      };
    case 'SET_PRICE_DATA':
        return {
            ...state,
            status: AppStatus.Success, // Show chart immediately
            priceData: action.payload,
            isChartLoading: false,
        };
    case 'SET_ANALYSIS_AND_NEWS':
        return {
            ...state,
            analysis: action.payload.analysis,
            news: action.payload.news,
            isAnalysisLoading: false,
            isNewsLoading: false,
            analysisCache: {
                ...state.analysisCache,
                [action.payload.coin]: action.payload.analysis,
            },
        };
    case 'USE_CACHED_ANALYSIS':
        return {
            ...state,
            analysis: action.payload.analysis,
            analyzedCoin: action.payload.coin,
            isAnalysisLoading: false,
        };
    case 'SET_NEWS':
        return {
            ...state,
            news: action.payload,
            isNewsLoading: false,
        };
    case 'FETCH_ERROR':
      return {
        ...state,
        status: AppStatus.Error,
        error: action.payload,
        analysis: null,
        priceData: [],
        news: [],
        isNewsLoading: false,
        isAnalysisLoading: false,
        isChartLoading: false,
      };
    case 'UPDATE_TICKER':
      return { ...state, tickerData: action.payload };
    case 'SET_COIN_INPUT':
      return { ...state, coinInput: action.payload, error: state.status === AppStatus.Error ? null : state.error };
    case 'RESET':
      return {
          ...initialState,
          analysisCache: state.analysisCache, // Persist cache on reset
          coinInput: state.coinInput,
          delistingWatchlist: state.delistingWatchlist, // Persist watchlist on reset
          isDelistingWatchlistLoading: false, // Don't show loading on reset
      };
    case 'SET_TIMEFRAME':
        return { ...state, timeframe: action.payload };
    case 'SET_CHART_LOADING':
        return { ...state, isChartLoading: action.payload };
    case 'SET_DELISTING_WATCHLIST':
        return {
            ...state,
            delistingWatchlist: action.payload,
            isDelistingWatchlistLoading: false,
        };
    case 'SET_DELISTING_WATCHLIST_LOADING':
        return { ...state, isDelistingWatchlistLoading: action.payload };
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { status, coinInput, analyzedCoin, priceData, analysis, tickerData, news, isNewsLoading, isAnalysisLoading, error, timeframe, isChartLoading, analysisCache, delistingWatchlist, isDelistingWatchlistLoading } = state;
  const inputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const loadDelistingWatchlist = useCallback(async () => {
    dispatch({ type: 'SET_DELISTING_WATCHLIST_LOADING', payload: true });
    try {
        const data = await fetchDelistingWatchlist();
        dispatch({ type: 'SET_DELISTING_WATCHLIST', payload: data });
    } catch (error) {
        console.error("Failed to load delisting watchlist", error);
        dispatch({ type: 'SET_DELISTING_WATCHLIST', payload: [] });
    }
  }, []);

  useEffect(() => {
    loadDelistingWatchlist();
  }, [loadDelistingWatchlist]);

  useEffect(() => {
    if (status !== AppStatus.Loading || !analyzedCoin) return;

    const analyzeCoin = async () => {
      try {
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
        
        const historicalData = await fetchHistoricalData(analyzedCoin, '1Y');
        dispatch({ type: 'SET_PRICE_DATA', payload: historicalData });

        if (analysisCache[analyzedCoin]) {
            console.log(`Using cached analysis for ${analyzedCoin}`);
            dispatch({ type: 'USE_CACHED_ANALYSIS', payload: { analysis: analysisCache[analyzedCoin], coin: analyzedCoin } });
            const baseCoin = analyzedCoin.split('/')[0];
            fetchNews(baseCoin).then(newsData => dispatch({ type: 'SET_NEWS', payload: newsData }));
            return;
        }
        
        console.log(`Fetching new analysis for ${analyzedCoin}`);
        const baseCoin = analyzedCoin.split('/')[0];
        const [aiAnalysis, fetchedNews] = await Promise.all([
          fetchAIAnalysis(analyzedCoin, historicalData),
          fetchNews(baseCoin)
        ]);
        
        dispatch({ type: 'SET_ANALYSIS_AND_NEWS', payload: { analysis: aiAnalysis, news: fetchedNews, coin: analyzedCoin } });

      } catch (err: any) {
        console.error(err);
        dispatch({ type: 'FETCH_ERROR', payload: err.message || 'Đã xảy ra lỗi không xác định.' });
      }
    };

    analyzeCoin();
  }, [status, analyzedCoin, analysisCache]);

  useEffect(() => {
    if (!analyzedCoin) return;

    const symbol = analyzedCoin.replace('/', '').toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);

    ws.onopen = () => console.log(`WebSocket connected for ${symbol}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      dispatch({
        type: 'UPDATE_TICKER',
        payload: {
          price: parseFloat(data.c).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
          change: parseFloat(data.p).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4, signDisplay: 'always' }),
          changePercent: `${parseFloat(data.P).toFixed(2)}%`,
          isPositive: parseFloat(data.p) >= 0,
        },
      });
    };
    ws.onerror = (error) => console.error("WebSocket Error: ", error);
    ws.onclose = () => console.log(`WebSocket disconnected for ${symbol}`);

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) ws.close();
    };
  }, [analyzedCoin]);
  
  const handleAnalysisRequest = useCallback((coin: string) => {
    if (!coin) return;
    const formattedCoin = coin.trim().toUpperCase().replace(/[^A-Z0-9/]/g, '');
    if (!formattedCoin.includes('/')) {
        dispatch({ type: 'FETCH_ERROR', payload: "Định dạng cặp coin không hợp lệ. Vui lòng sử dụng 'COIN/QUOTE', ví dụ: BTC/USDT." });
        return;
    }
    dispatch({ type: 'START_ANALYSIS', payload: formattedCoin });
  }, []);

  const handleTimeframeChange = useCallback(async (newTimeframe: Timeframe) => {
    if (!analyzedCoin || newTimeframe === timeframe) return;
    
    dispatch({ type: 'SET_TIMEFRAME', payload: newTimeframe });
    dispatch({ type: 'SET_CHART_LOADING', payload: true });
    
    try {
      const newPriceData = await fetchHistoricalData(analyzedCoin, newTimeframe);
      dispatch({ type: 'SET_PRICE_DATA', payload: newPriceData });
    } catch (err: any) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message || `Không thể tải dữ liệu cho khung thời gian ${newTimeframe}.` });
    } finally {
      dispatch({ type: 'SET_CHART_LOADING', payload: false });
    }
  }, [analyzedCoin, timeframe]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalysisRequest(coinInput);
  };

  const handleClearInput = () => {
    dispatch({ type: 'SET_COIN_INPUT', payload: '' });
    inputRef.current?.focus();
  };
  
  const handleReset = () => dispatch({ type: 'RESET' });

  const renderContent = () => {
    switch(status) {
      case AppStatus.Loading:
        return <DashboardSkeleton />;
      case AppStatus.Error:
        return (
          <div className="flex flex-col items-center justify-center min-h-[600px] glassmorphism rounded-xl p-8 text-center animate-fade-in">
            <XCircleIcon className="w-16 h-16 text-red-500/80 mx-auto" />
            <h3 className="text-2xl font-bold text-red-400 mt-4">Rất tiếc, đã xảy ra lỗi</h3>
            <div className="mt-2 text-red-300 bg-red-500/10 p-3 rounded-lg max-w-lg">
                <p className="whitespace-pre-wrap">{error}</p>
            </div>
          </div>
        );
      case AppStatus.Success:
        return (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 h-[400px] sm:h-[500px] lg:h-[600px]">
                <PriceChart 
                  priceData={priceData} 
                  analysis={analysis}
                  timeframe={timeframe}
                  onTimeframeChange={handleTimeframeChange}
                  isChartLoading={isChartLoading}
                  tickerData={tickerData}
                  coinPair={analyzedCoin}
                />
              </div>
              <div className="lg:col-span-1">
                <AnalysisDisplay isLoading={isAnalysisLoading} analysis={analysis} coinPair={analyzedCoin} />
              </div>
            </div>
             <DelistingWatchlist watchlist={delistingWatchlist} isLoading={isDelistingWatchlistLoading} onRefresh={loadDelistingWatchlist} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <NewsFeed news={news} isLoading={isNewsLoading} />
                <SupportProject />
            </div>
          </div>
        );
      case AppStatus.Idle:
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-8">
             <div className="p-8 max-w-2xl w-full">
                <CpuChipIcon className="w-16 h-16 mx-auto text-cyan-400/70" />
                <h2 className="text-3xl font-bold text-gray-100 mt-4">Bắt đầu phân tích</h2>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    Chọn một cặp tiền điện tử phổ biến hoặc nhập một cặp tùy chỉnh để nhận phân tích kỹ thuật chi tiết do AI cung cấp.
                </p>
             </div>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen text-gray-100">
      <main className="p-4 sm:p-6 lg:p-8 max-w-8xl mx-auto pb-24">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-teal-400">
            Binance Coin AI Analyzer
          </h1>
          <p className="mt-2 text-lg text-gray-400">Phân tích kỹ thuật chuyên sâu bằng Trí tuệ nhân tạo</p>
        </header>
        
        <div className="p-4 glassmorphism rounded-xl max-w-4xl mx-auto sticky top-4 z-40 shadow-2xl">
            {analyzedCoin && (status === AppStatus.Success || status === AppStatus.Loading) ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <span className="text-gray-400 text-sm">Đang xem phân tích cho</span>
                        <h2 className="text-2xl font-bold text-white">{analyzedCoin}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-5 py-2.5 font-bold text-cyan-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 flex-shrink-0 flex items-center justify-center gap-2"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        Phân tích Cặp Mới
                    </button>
                </div>
            ) : (
                <>
                    <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
                        <div className="relative flex-grow">
                            <input
                                ref={inputRef} type="text" value={coinInput}
                                onChange={(e) => dispatch({ type: 'SET_COIN_INPUT', payload: e.target.value })}
                                placeholder="Nhập cặp coin (ví dụ: BTC/USDT)"
                                className="w-full bg-gray-700 text-gray-100 placeholder-gray-400 px-4 py-3 rounded-lg border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all pr-10"
                                aria-label="Cặp coin"
                            />
                            {coinInput && status !== AppStatus.Loading && (
                                <button type="button" onClick={handleClearInput} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white transition-colors" aria-label="Xóa nội dung">
                                    <XCircleIcon className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        <button 
                            type="submit" disabled={status === AppStatus.Loading || !coinInput}
                            className="px-8 py-3 font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg hover:from-cyan-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {status === AppStatus.Loading ? 'Đang xử lý...' : 'Phân tích'}
                        </button>
                    </form>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                        {COIN_PAIRS.slice(0, 6).map(pair => (
                            <button key={pair} onClick={() => handleAnalysisRequest(pair)}
                                className="px-3 py-2 text-sm font-semibold text-cyan-300 bg-gray-900/50 rounded-md border border-gray-700 hover:bg-gray-800 hover:text-white hover:border-cyan-500 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50"
                                disabled={status === AppStatus.Loading}
                            >
                                {pair}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
        
        <div ref={mainContentRef} className="min-h-[600px] mt-8">
          {renderContent()}
        </div>
        
      </main>
      <Disclaimer />
    </div>
  );
};

export default App;