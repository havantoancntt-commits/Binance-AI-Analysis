import React, { useReducer, useCallback, useEffect, useRef, useMemo } from 'react';
import type { AppState, AppAction, ChartTimeframe } from './types';
import { AppStatus } from './types';
import { fetchAIAnalysis } from './services/geminiService';
import { fetchHistoricalData } from './services/binanceService';
import { useTranslation } from './hooks/useTranslation';

import PriceChart from './components/PriceChart';
import AnalysisDisplay from './components/AnalysisDisplay';
import Disclaimer from './components/Disclaimer';
import MotivationalTicker from './components/MotivationalTicker';
import FloatingActionMenu from './components/FloatingActionMenu';
import Chatbot from './components/Chatbot';
import Logo from './components/Logo';
import DashboardSkeleton from './components/DashboardSkeleton';

import { COIN_PAIRS } from './constants';
import { XCircleIcon, ArrowPathIcon, CpuChipIcon } from './components/Icons';

const initialState: AppState = {
  status: AppStatus.Idle,
  coinInput: '',
  analyzedCoin: null,
  priceData7D: [],
  priceData3M: [],
  priceData1Y: [],
  chartTimeframe: '3M',
  analysis: null,
  tickerData: null,
  isAnalysisLoading: false,
  error: null,
  analysisCache: {},
  isPanelOpen: true, 
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
        priceData7D: [],
        priceData3M: [],
        priceData1Y: [],
        tickerData: null,
        isAnalysisLoading: true,
        chartTimeframe: '3M',
      };
    case 'SET_ALL_PRICE_DATA':
      return { 
          ...state, 
          priceData7D: action.payload.priceData7D,
          priceData3M: action.payload.priceData3M,
          priceData1Y: action.payload.priceData1Y,
      };
    case 'SET_CHART_TIMEFRAME':
        return { ...state, chartTimeframe: action.payload };
    case 'SET_ANALYSIS':
      return {
        ...state,
        status: AppStatus.Success,
        analysis: action.payload.analysis,
        isAnalysisLoading: false,
        analysisCache: { ...state.analysisCache, [action.payload.coin]: action.payload.analysis },
        isPanelOpen: true,
      };
    case 'USE_CACHED_ANALYSIS':
      return {
        ...state,
        status: AppStatus.Success,
        analysis: action.payload.analysis,
        analyzedCoin: action.payload.coin,
        isAnalysisLoading: false,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        status: AppStatus.Error,
        error: action.payload,
        analysis: null,
        priceData7D: [],
        priceData3M: [],
        priceData1Y: [],
        isAnalysisLoading: false,
        isPanelOpen: false,
      };
    case 'UPDATE_TICKER':
      return { ...state, tickerData: action.payload };
    case 'SET_COIN_INPUT':
      return { ...state, coinInput: action.payload, error: state.status === AppStatus.Error ? null : state.error };
    case 'TOGGLE_ANALYSIS_PANEL':
      return { ...state, isPanelOpen: !state.isPanelOpen };
    case 'RESET':
      return {
        ...initialState,
        analysisCache: state.analysisCache,
        coinInput: '',
      };
    default:
      return state;
  }
}

const App: React.FC = () => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { status, coinInput, analyzedCoin, priceData7D, priceData3M, priceData1Y, chartTimeframe, analysis, tickerData, isAnalysisLoading, error, isPanelOpen } = state;
  const { t, locale } = useTranslation();
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Main analysis logic
  useEffect(() => {
    if (status !== AppStatus.Loading || !analyzedCoin) return;
    let isCancelled = false;

    const analyzeCoin = async () => {
      try {
        const [priceData1Y, priceData3M, priceData7D] = await Promise.all([
            fetchHistoricalData(analyzedCoin, '1Y'),
            fetchHistoricalData(analyzedCoin, '3M'),
            fetchHistoricalData(analyzedCoin, '7D')
        ]);

        if (isCancelled) return;
        // FIX: Corrected typo from priceDataD to priceData7D
        dispatch({ type: 'SET_ALL_PRICE_DATA', payload: { priceData7D, priceData3M, priceData1Y } });
        
        const aiAnalysis = await fetchAIAnalysis(analyzedCoin, { priceData1Y, priceData3M, priceData7D }, locale);
        
        if (isCancelled) return;
        dispatch({ type: 'SET_ANALYSIS', payload: { analysis: aiAnalysis, coin: analyzedCoin } });

      } catch (err: any) {
        if (isCancelled) return;
        console.error(err);
        dispatch({ type: 'FETCH_ERROR', payload: err.message || t('form.error.unknown') });
      }
    };

    analyzeCoin();
    return () => { isCancelled = true; };
  }, [status, analyzedCoin, locale, t]);

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
        dispatch({ type: 'FETCH_ERROR', payload: t('form.error.invalidPair') });
        return;
    }
    dispatch({ type: 'START_ANALYSIS', payload: formattedCoin });
  }, [t]);

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

  const chartData = useMemo(() => {
    switch(chartTimeframe) {
        case '7D': return priceData7D;
        case '1Y': return priceData1Y;
        case '3M':
        default: return priceData3M;
    }
  }, [chartTimeframe, priceData7D, priceData3M, priceData1Y]);

  const handleTimeframeChange = useCallback((tf: ChartTimeframe) => {
    dispatch({ type: 'SET_CHART_TIMEFRAME', payload: tf });
  }, []);

  const handleTogglePanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_ANALYSIS_PANEL' });
  }, []);

  const renderContent = () => {
    if (status === AppStatus.Idle) {
      return (
        <div className="animate-fade-in-up">
           <div className="flex flex-col items-center text-center p-4 sm:p-8 mt-4 sm:mt-8">
              <Logo className="w-20 h-20" />
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-100 mt-6">{t('dashboard.welcome.title')}</h2>
              <p className="text-gray-400 mt-2 max-w-lg mx-auto">{t('dashboard.welcome.subtitle')}</p>
              <MotivationalTicker />
           </div>
        </div>
      );
    }

    if (status === AppStatus.Error && error) {
      return (
        <div className="flex justify-center items-center py-10 animate-fade-in-up">
          <div className="w-full max-w-3xl glassmorphism rounded-xl p-8 text-center aurora-card">
              <XCircleIcon className="w-16 h-16 text-rose-500/80 mx-auto" />
              <h3 className="text-2xl font-bold text-rose-400 mt-4">{t('dashboard.error.title')}</h3>
              <div className="mt-2 text-rose-300 bg-rose-500/10 p-3 rounded-lg max-w-lg mx-auto">
                  <p className="whitespace-pre-wrap">{error}</p>
              </div>
          </div>
        </div>
      );
    }
    
    if (status === AppStatus.Loading) {
      return <DashboardSkeleton />;
    }

    if (status === AppStatus.Success && analyzedCoin) {
      return (
        <div className="animate-fade-in-up">
          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[600px]">
            <div className={`transition-all duration-500 ease-in-out h-full ${isPanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              <PriceChart 
                priceData={chartData} 
                analysis={analysis} 
                tickerData={tickerData} 
                coinPair={analyzedCoin}
                activeTimeframe={chartTimeframe}
                isPanelOpen={isPanelOpen}
                onTimeframeChange={handleTimeframeChange}
                onTogglePanel={handleTogglePanel}
              />
            </div>
            {isPanelOpen && (
              <div className="lg:col-span-4 h-full animate-fade-in-up">
                <AnalysisDisplay isLoading={isAnalysisLoading} analysis={analysis} coinPair={analyzedCoin} />
              </div>
            )}
          </div>
        </div>
      );
    }

    return null; // Should not be reached
  };

  return (
    <>
      <main className="p-4 sm:p-6 lg:p-8 max-w-screen-2xl mx-auto w-full min-h-screen">
        <header className="flex flex-col items-center text-center mb-8 opacity-0 animate-fade-in-up" style={{animationFillMode: 'forwards'}}>
          <div className="flex items-center justify-center gap-3 sm:gap-4">
            <Logo className="w-12 h-12 sm:w-14 sm:h-14" />
            <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-violet-400">
                  {t('header.title')}
                </h1>
                <p className="mt-1 text-base sm:text-lg text-teal-100/70">{t('header.subtitle')}</p>
            </div>
          </div>
        </header>
        
        <div className="glassmorphism aurora-card rounded-xl max-w-4xl mx-auto opacity-0 animate-fade-in-up stagger-delay-1 p-1" style={{animationFillMode: 'forwards'}}>
            <div className="bg-[rgb(var(--background-rgb))] rounded-lg p-4 sm:p-6">
              {analyzedCoin && status !== AppStatus.Idle && status !== AppStatus.Error ? (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div>
                          <span className="text-gray-400 text-sm">{t('dashboard.viewingAnalysisFor')}</span>
                          <h2 className="text-2xl font-bold text-white">{analyzedCoin}</h2>
                      </div>
                      <button
                          type="button"
                          onClick={handleReset}
                          className="px-5 py-2.5 font-semibold text-teal-300 bg-gray-800/80 rounded-lg border border-gray-700 hover:bg-gray-700/80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background-rgb))] focus:ring-teal-500 flex-shrink-0 flex items-center justify-center gap-2 hover:-translate-y-0.5 transform shimmer-button"
                      >
                          <ArrowPathIcon className="w-5 h-5" />
                          {t('dashboard.button.newAnalysis')}
                      </button>
                  </div>
              ) : (
                  <>
                      <div className="flex items-center gap-2 text-violet-300 text-sm font-semibold mb-3">
                        <CpuChipIcon className="w-5 h-5" />
                        <span>{t('form.commandCenter')}</span>
                      </div>
                      <form onSubmit={handleFormSubmit} className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
                          <div className="relative flex-grow">
                              <input
                                  ref={inputRef} type="text" value={coinInput}
                                  onChange={(e) => dispatch({ type: 'SET_COIN_INPUT', payload: e.target.value })}
                                  placeholder={t('form.placeholder')}
                                  className="w-full bg-gray-900/70 text-gray-100 placeholder-gray-500 px-5 py-4 rounded-lg border-2 border-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent pr-10"
                                  aria-label={t('form.coinPairLabel')}
                              />
                              {coinInput && status !== AppStatus.Loading && (
                                  <button type="button" onClick={handleClearInput} className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-white" aria-label={t('form.button.clear')}>
                                      <XCircleIcon className="h-5 w-5" />
                                  </button>
                              )}
                          </div>
                          <button 
                              type="submit" disabled={status === AppStatus.Loading || !coinInput}
                              className="px-8 py-3 font-bold text-white bg-gradient-to-r from-teal-500 to-violet-500 rounded-lg hover:from-teal-400 hover:to-violet-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[rgb(var(--background-rgb))] focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transform hover:scale-105 shimmer-button"
                          >
                              {status === AppStatus.Loading ? t('form.button.analyzing') : t('form.button.analyze')}
                          </button>
                      </form>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mt-4">
                          {COIN_PAIRS.slice(0, 6).map((pair) => (
                              <button key={pair} onClick={() => handleAnalysisRequest(pair)}
                                  className="px-3 py-2 text-sm font-semibold text-violet-300/90 bg-gray-900/50 rounded-md border border-gray-700/80 hover:bg-violet-900/20 hover:text-white hover:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500 disabled:opacity-50 transform hover:-translate-y-0.5 shimmer-button"
                                  disabled={status === AppStatus.Loading}
                              >
                                  {pair}
                              </button>
                          ))}
                      </div>
                  </>
              )}
            </div>
        </div>
        
        <div className="mt-8">
          {renderContent()}
        </div>
        
        <Disclaimer />
      </main>
      <Chatbot />
      <FloatingActionMenu />
    </>
  );
};

export default App;