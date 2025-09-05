

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { PriceDataPoint, AnalysisResult, TickerData, NewsArticle } from './types';
import { AppStatus } from './types';
import { getAIAnalysis } from './services/geminiService';
import { fetchHistoricalData } from './services/binanceService';
import { fetchNews } from './services/newsService';
import PriceChart from './components/PriceChart';
import AnalysisDisplay from './components/AnalysisDisplay';
import Disclaimer from './components/Disclaimer';
import Ticker from './components/Ticker';
import DonationCallout from './components/PriceAlert';
import NewsFeed from './components/NewsFeed';
import { COIN_PAIRS } from './constants';
import { XCircleIcon, ArrowPathIcon, CpuChipIcon } from './components/Icons';

const App: React.FC = () => {
  const [coinInput, setCoinInput] = useState<string>('');
  const [analyzedCoin, setAnalyzedCoin] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<PriceDataPoint[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [tickerData, setTickerData] = useState<TickerData | null>(null);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [isNewsLoading, setIsNewsLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.Idle);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === AppStatus.Loading) {
      const messages = [
        `Đang tìm nạp dữ liệu lịch sử cho ${analyzedCoin}...`,
        `AI đang phân tích biểu đồ...`,
        `Xác định các mức hỗ trợ và kháng cự...`,
        `Xây dựng các kịch bản thị trường...`,
        `Tạo báo cáo phân tích...`,
      ];
      let messageIndex = 0;
      setLoadingMessage(messages[messageIndex]);
      const interval = setInterval(() => {
        messageIndex++;
        if (messageIndex < messages.length) {
          setLoadingMessage(messages[messageIndex]);
        } else {
          clearInterval(interval);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [status, analyzedCoin]);

  useEffect(() => {
    if (!analyzedCoin) {
      return;
    }

    const symbol = analyzedCoin.replace('/', '').toLowerCase();
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol}@ticker`);

    ws.onopen = () => console.log(`WebSocket connected for ${symbol}`);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setTickerData({
        price: parseFloat(data.c).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
        change: parseFloat(data.p).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4, signDisplay: 'always' }),
        changePercent: `${parseFloat(data.P).toFixed(2)}%`,
        isPositive: parseFloat(data.p) >= 0,
      });
    };
    ws.onerror = (error) => console.error("WebSocket Error: ", error);
    ws.onclose = () => console.log(`WebSocket disconnected for ${symbol}`);

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [analyzedCoin]);

  const handleAnalysis = useCallback(async (coin: string) => {
    if (!coin) return;
    setStatus(AppStatus.Loading);
    setError(null);
    setAnalysis(null);
    setPriceData([]);
    setTickerData(null);
    setNews([]);
    setAnalyzedCoin(coin);

    try {
      const baseCoin = coin.split('/')[0];
      setIsNewsLoading(true);
      const newsPromise = fetchNews(baseCoin);
      
      const historicalData = await fetchHistoricalData(coin, 365);
      setPriceData(historicalData);
      
      const fetchedNews = await newsPromise;
      setNews(fetchedNews);
      setIsNewsLoading(false);
      
      if (historicalData.length > 0) {
        const aiAnalysis = await getAIAnalysis(coin, historicalData);
        setAnalysis(aiAnalysis);
      } else {
        setAnalysis(null);
      }
      
      setStatus(AppStatus.Success);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Đã xảy ra lỗi không xác định.');
      setStatus(AppStatus.Error);
      setPriceData([]);
      setIsNewsLoading(false);
    }
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formattedCoin = coinInput.trim().toUpperCase().replace(/[^A-Z0-9/]/g, '');
    if (!formattedCoin.includes('/')) {
        setError("Định dạng cặp coin không hợp lệ. Vui lòng sử dụng 'COIN/QUOTE', ví dụ: BTC/USDT.");
        return;
    }
    setCoinInput(formattedCoin);
    await handleAnalysis(formattedCoin);
  };
  
  const handleRetry = () => {
    if (analyzedCoin) {
      handleAnalysis(analyzedCoin);
    }
  };
  
  const handleClearInput = () => {
    setCoinInput('');
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setStatus(AppStatus.Idle);
    setAnalyzedCoin(null);
    setPriceData([]);
    setAnalysis(null);
    setTickerData(null);
    setError(null);
    setNews([]);
    setCoinInput('');
    inputRef.current?.focus();
  };

  const renderContent = () => {
    switch(status) {
      case AppStatus.Loading:
        return (
          <div className="flex flex-col items-center justify-center min-h-[600px]">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-500 mb-6"></div>
            <p className="text-lg text-cyan-300 font-semibold">{loadingMessage}</p>
          </div>
        );
      case AppStatus.Error:
        return (
          <div className="flex flex-col items-center justify-center min-h-[600px] glassmorphism rounded-xl p-8 text-center animate-fade-in">
            <XCircleIcon className="w-16 h-16 text-red-500/80 mx-auto" />
            <h3 className="text-2xl font-bold text-red-400 mt-4">Rất tiếc, đã xảy ra lỗi</h3>
            <div className="mt-2 text-red-300 bg-red-500/10 p-3 rounded-lg max-w-lg">
                <p>{error}</p>
            </div>
            {analyzedCoin && (
              <button 
                onClick={handleRetry} 
                className="mt-6 flex items-center gap-2 px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
              >
                <ArrowPathIcon className="w-5 h-5" />
                Thử lại cho {analyzedCoin}
              </button>
            )}
          </div>
        );
      case AppStatus.Success:
        return (
          <div className="space-y-8">
            <Ticker coinPair={analyzedCoin} tickerData={tickerData} />
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3 h-[400px] sm:h-[500px] lg:h-[600px]">
                <PriceChart priceData={priceData} analysis={analysis} />
              </div>
              <div className="lg:col-span-2">
                <AnalysisDisplay key={analyzedCoin} analysis={analysis} coinPair={analyzedCoin} />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <NewsFeed news={news} isLoading={isNewsLoading} />
                </div>
                <div className="lg:col-span-2">
                    <DonationCallout />
                </div>
            </div>
          </div>
        );
      case AppStatus.Idle:
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[600px] text-center">
            <div className="glassmorphism p-8 rounded-xl max-w-2xl w-full animate-fade-in">
                <CpuChipIcon className="w-16 h-16 mx-auto text-cyan-400/70" />
                <h2 className="text-3xl font-bold text-gray-100 mt-4">Chào mừng bạn đến với AI Analyzer</h2>
                <p className="text-gray-400 mt-2 max-w-md mx-auto">
                    Chọn một cặp tiền điện tử phổ biến hoặc nhập một cặp tùy chỉnh để nhận phân tích kỹ thuật chi tiết.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
                    {COIN_PAIRS.slice(0, 6).map(pair => (
                        <button 
                            key={pair}
                            onClick={() => { setCoinInput(pair); handleAnalysis(pair); }}
                            className="px-4 py-3 font-semibold text-cyan-300 bg-gray-900/50 rounded-lg border border-gray-700 hover:bg-gray-800 hover:text-white hover:border-cyan-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                            {pair}
                        </button>
                    ))}
                </div>
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
        
        {status !== AppStatus.Success && (
        <div className="mb-8 space-y-4">
          <div className="p-4 glassmorphism rounded-xl max-w-3xl mx-auto">
              <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
                  <div className="relative flex-grow">
                      <input
                          ref={inputRef}
                          type="text"
                          value={coinInput}
                          onChange={(e) => setCoinInput(e.target.value)}
                          placeholder="Nhập cặp coin (ví dụ: BTC/USDT)"
                          className="w-full bg-gray-700 text-gray-100 placeholder-gray-400 px-4 py-3 rounded-lg border-2 border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all pr-10"
                          aria-label="Cặp coin"
                      />
                      {coinInput && status !== AppStatus.Loading && (
                          <button
                              type="button"
                              onClick={handleClearInput}
                              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white transition-colors"
                              aria-label="Xóa nội dung"
                          >
                              <XCircleIcon className="h-5 w-5" />
                          </button>
                      )}
                  </div>
                  <button 
                      type="submit" 
                      disabled={status === AppStatus.Loading || !coinInput}
                      className="px-8 py-3 font-bold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-lg hover:from-cyan-500 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                      {status === AppStatus.Loading ? 'Đang xử lý...' : 'Phân tích'}
                  </button>
              </form>
              {status !== AppStatus.Loading && error && (
                  <p className="text-red-400 text-center mt-3">{error}</p>
              )}
          </div>
        </div>
        )}

        { (status === AppStatus.Success || status === AppStatus.Error) &&
            <div className="text-center mb-8">
                <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 font-bold text-cyan-300 bg-gray-700 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 transition-all duration-300 flex-shrink-0 flex items-center justify-center gap-2 mx-auto"
                >
                    <ArrowPathIcon className="w-5 h-5" />
                    Phân tích Cặp Coin Mới
                </button>
            </div>
        }
        
        <div className="min-h-[600px]">
          {renderContent()}
        </div>
        
      </main>
      <Disclaimer />
    </div>
  );
};

export default App;