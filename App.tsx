
import React, { useReducer, useCallback, useEffect, useRef } from 'react';
import type { AppState, AppAction } from './types';
import { AppStatus } from './types';
import { fetchAIAnalysis } from './services/geminiService';
import { fetchHistoricalData } from './services/binanceService';
import { fetchNews } from './services/newsService';

import PriceChart from './components/PriceChart';
import AnalysisDisplay from './components/AnalysisDisplay';
import Disclaimer from './components/Disclaimer';
import DashboardSkeleton from './components/DashboardSkeleton';
import MotivationalTicker from './components/MotivationalTicker';
import NewsFeed from './components/NewsFeed';
import ActionCenter from './components/ActionCenter';

import { COIN_PAIRS } from './constants';
import { XCircleIcon, ArrowPathIcon, CpuChipIcon } from './components/Icons';

const initialState: AppState = {
  status: AppStatus.Idle,
  coinInput: 'BTC/USDT',
  analyzedCoin: null,
  priceData: [],
  analysis: null,
  tickerData: null,
  news: [],
  isAnalysisLoading: false,
  isExtraDataLoading: false,
  error: null,
  analysisCache: {},
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
        tickerData: null,
        news: [],
        isAnalysisLoading: true,
      };
    case 'SET_PRICE_DATA':
      return { ...state, priceData: action.payload };
    case 'SET_ANALYSIS':
      return {
        ...state,
        status: AppStatus.Success,
        analysis: action.payload.analysis,
        isAnalysisLoading: false,
        analysisCache: { ...state.analysisCache, [action.payload.coin]: action.payload.analysis },
      };
    case 'USE_CACHED_ANALYSIS':
      return {
        ...state,
        status: AppStatus.Success,
        analysis: action.payload.analysis,
        analyzedCoin: action.payload.coin,
        isAnalysisLoading: false,
      };
    case 'START_EXTRA_DATA_FETCH':
      return { ...state, isExtraDataLoading: true };
    case 'SET_NEWS':
      return {
        ...state,
        news: action.payload,
        isExtraDataLoading: false,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        status: AppStatus.Error,
        error: action.payload,
        analysis: null,
        priceData: [],
        isAnalysisLoading: false,
        isExtraDataLoading: false,
      };
    case 'UPDATE_TICKER':
      return { ...state, tickerData: action.payload };
    case 'SET_COIN_INPUT':
      return { ...state, coinInput: action.payload, error: state.status === AppStatus.Error ? null : state.error };
    case 'RESET':
      return {
        ...initialState,
        analysisCache: state.analysisCache,
        coinInput: state.coinInput,
      };
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { status, coinInput, analyzedCoin, priceData, analysis, tickerData, isAnalysisLoading, error, analysisCache, news, isExtraDataLoading } = state;
  const inputRef = useRef<HTMLInputElement>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // Main analysis logic
  useEffect(() => {
    if (status !== AppStatus.Loading || !analyzedCoin) return;
    let isCancelled = false;

    const analyzeCoin = async () => {
      try {
        mainContentRef.current?.scrollIntoView({ behavior: 'smooth' });
        
        // Fetch coin-specific news in parallel with price data for better performance
        const baseCoin = analyzedCoin.split('/')[0];
        dispatch({ type: 'START_EXTRA_DATA_FETCH' });
        const newsPromise = fetchNews(baseCoin);

        const [priceData1Y, priceData3M, priceData7D] = await Promise.all([
            fetchHistoricalData(analyzedCoin, '1Y'),
            fetchHistoricalData(analyzedCoin, '3M'),
            fetchHistoricalData(analyzedCoin, '7D')
        ]);

        if (isCancelled) return;
        dispatch({ type: 'SET_PRICE_DATA', payload: priceData3M });

        // Handle news data
        const newsData = await newsPromise;
        if (!isCancelled) {
            dispatch({ type: 'SET_NEWS', payload: newsData });
        }

        if (analysisCache[analyzedCoin]) {
            console.log(`Using cached analysis for ${analyzedCoin}`);
            dispatch({ type: 'USE_CACHED_ANALYSIS', payload: { analysis: analysisCache[analyzedCoin], coin: analyzedCoin } });
            return;
        }
        
        console.log(`Fetching new analysis for ${analyzedCoin}`);
        const aiAnalysis = await fetchAIAnalysis(analyzedCoin, { priceData1Y, priceData3M, priceData7D });
        
        if (isCancelled) return;
        dispatch({ type: 'SET_ANALYSIS', payload: { analysis: aiAnalysis, coin: analyzedCoin } });

      } catch (err: any) {
        if (isCancelled) return;
        console.error(err);
        dispatch({ type: 'FETCH_ERROR', payload: err.message || 'Đã xảy ra lỗi không xác định.' });
      }
    };

    analyzeCoin();
    return () => { isCancelled = true; };
  }, [status, analyzedCoin, analysisCache]);

  // WebSocket for live ticker data
  useEffect(() => {
    if (!analyzedCoin) return;
    const symbol = analyzedCoin.replace('/', '').toLowerCase();
    let ws: WebSocket;
    let connectTimeout: number;
    const connect = () => {
        ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);
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
        ws.onclose = () => {
            clearTimeout(connectTimeout);
            connectTimeout = window.setTimeout(connect, 5000);
        };
    };
    connect();
    return () => {
        clearTimeout(connectTimeout);
        if (ws) { ws.onclose = null; ws.close(); }
    };
  }, [analyzedCoin]);
  
  const handleAnalysisRequest = useCallback((coin: string) => {
    if (!coin) return;
    const formattedCoin = coin.trim().toUpperCase().replace(/[^A-Z0-9/]/g, '');
    if (!/^[A-Z0-9]{2,}\/[A-Z0-9]{3,}$/.test(formattedCoin)) {
        dispatch({ type: 'FETCH_ERROR', payload: "Định dạng cặp coin không hợp lệ. Vui lòng sử dụng 'COIN/QUOTE', ví dụ: BTC/USDT." });
        return;
    }
    dispatch({ type: 'START_ANALYSIS', payload: formattedCoin });
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAnalysisRequest(coinInput);
  };
  
  const handleClearInput = () => {
    dispatch({ type: 'SET_COIN_INPUT', payload: '' });
    inputRef.current?.focus();
  };
  
  const handleReset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const renderContent = () => {
    if (status === AppStatus.Loading) {
      return <DashboardSkeleton />;
    }
    
    if (status === AppStatus.Error && error) {
      return (
        <div className="flex justify-center items-center py-10 animate-fade-in">
          <div className="w-full max-w-3xl glassmorphism rounded-xl p-8 text-center">
              <XCircleIcon className="w-16 h-16 text-red-500/80 mx-auto" />
              <h3 className="text-2xl font-bold text-red-400 mt-4">Rất tiếc, đã xảy ra lỗi</h3>
              <div className="mt-2 text-red-300 bg-red-500/10 p-3 rounded-lg max-w-lg mx-auto">
                  <p className="whitespace-pre-wrap">{error}</p>
              </div>
          </div>
        </div>
      );
    }
    
    if (status === AppStatus.Success && analyzedCoin && analysis) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 animate-fade-in">
          <div className="lg:col-span-3 h-[450px] sm:h-[500px] lg:h-[600px]">
            <PriceChart priceData={priceData} analysis={analysis} tickerData={tickerData} coinPair={analyzedCoin} />
          </div>
          <div className="lg:col-span-2 space-y-8">
            <AnalysisDisplay isLoading={isAnalysisLoading} analysis={analysis} coinPair={analyzedCoin} />
            <ActionCenter />
            <NewsFeed news={news} isLoading={isExtraDataLoading} />
          </div>
        </div>
      );
    }
    
    // Idle State
    return (
      <div className="animate-fade-in">
        <div className="text-center p-8 max-w-3xl mx-auto">
           <CpuChipIcon className="w-16 h-16 mx-auto text-red-400/70" />
           <h2 className="text-3xl font-bold text-gray-100 mt-4">Chào mừng đến với Bảng điều khiển Phân tích AI</h2>
           <p className="text-gray-400 mt-2">
               Nhận thông tin chi tiết về thị trường tức thì. Bắt đầu bằng cách chọn một cặp phổ biến hoặc nhập một cặp tùy chỉnh ở trên.
           </p>
           <MotivationalTicker />
        </div>
        <div className="mt-8 max-w-2xl mx-auto">
            <ActionCenter />
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen text-gray-100">
      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto pb-24">
        <header className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">
            Meta Mind Crypto
          </h1>
          <p className="mt-2 text-base sm:text-lg text-orange-100/80">Dẫn Lối Thị Trường Tiền Điện Tử Bằng Trí Tuệ Nhân Tạo</p>
        </header>
        
        <div className="p-4 glassmorphism rounded-xl max-w-4xl mx-auto sticky top-4 z-40">
            {analyzedCoin && (status === AppStatus.Success || status === AppStatus.Loading || status === AppStatus.Error) ? (
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <span className="text-gray-400 text-sm">Đang xem phân tích cho</span>
                        <h2 className="text-2xl font-bold text-white">{analyzedCoin}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-5 py-2.5 font-bold text-orange-300 bg-gray-700/50 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-all duration-300 flex-shrink-0 flex items-center justify-center gap-2"
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
                                className="w-full bg-gray-800/80 text-gray-100 placeholder-gray-500 px-4 py-3 rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all pr-10"
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
                            className="px-8 py-3 font-bold text-white bg-gradient-to-r from-red-600 to-orange-500 rounded-lg hover:from-red-500 hover:to-orange-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-red-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                            {status === AppStatus.Loading ? 'Đang xử lý...' : 'Phân tích'}
                        </button>
                    </form>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                        {COIN_PAIRS.slice(0, 6).map(pair => (
                            <button key={pair} onClick={() => handleAnalysisRequest(pair)}
                                className="px-3 py-2 text-sm font-semibold text-orange-300 bg-gray-900/50 rounded-md border border-gray-700 hover:bg-red-900/50 hover:text-white hover:border-red-500 transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50"
                                disabled={status === AppStatus.Loading}
                            >
                                {pair}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
        
        <div ref={mainContentRef} className="mt-8">
          {renderContent()}
        </div>
        
      </main>
      <Disclaimer />
    </div>
  );
};

export default App;