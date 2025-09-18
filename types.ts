
export interface PriceDataPoint {
  date: string;
  price: number;
  volume: number;
}

export interface Recommendation {
  signal: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'Avoid';
  reason: string;
}

export interface TrendInfo {
  trend: 'Uptrend' | 'Downtrend' | 'Sideways';
  reason: string;
}

export interface AnalysisResult {
  supportLevels: number[];
  resistanceLevels: number[];
  buyZone: {
    from: number;
    to: number;
  };
  takeProfitLevels: number[];
  stopLoss: number;
  trendAnalysis: {
    shortTerm: TrendInfo;
    mediumTerm: TrendInfo;
    longTerm: TrendInfo;
  };
  confidenceScore: number;
  confidenceReason: string;
  marketDriver: string;
  summary: string; // Will now hold the "Strategic Outlook"
  recommendation: Recommendation;
  detailedAnalysis: {
    bullCase: string;
    bearCase: string;
  };
  marketSentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  keyTakeaways: string[];
}

// FIX: Add missing NewsArticle interface.
export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedOn: number;
  url: string;
  imageUrl: string;
}

export enum AppStatus {
  Idle,
  Loading,
  Success,
  Error,
}

export interface TickerData {
  price: string;
  change: string;
  changePercent: string;
  isPositive: boolean;
}

// FIX: Add missing DelistingCoin interface.
export interface DelistingCoin {
  coinPair: string;
  delistingDate: string;
  reason: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

// Centralized state and action types for the application
export interface AppState {
  status: AppStatus;
  coinInput: string;
  analyzedCoin: string | null;
  priceData: PriceDataPoint[];
  analysis: AnalysisResult | null;
  tickerData: TickerData | null;
  isAnalysisLoading: boolean; // For primary AI analysis
  error: string | null;
  analysisCache: Record<string, AnalysisResult>;
}

export type AppAction =
  | { type: 'START_ANALYSIS'; payload: string }
  | { type: 'SET_PRICE_DATA'; payload: PriceDataPoint[] }
  | { type: 'SET_ANALYSIS'; payload: { analysis: AnalysisResult; coin: string } }
  | { type: 'USE_CACHED_ANALYSIS'; payload: { analysis: AnalysisResult; coin: string } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'UPDATE_TICKER'; payload: TickerData | null }
  | { type: 'SET_COIN_INPUT'; payload: string }
  | { type: 'RESET' };