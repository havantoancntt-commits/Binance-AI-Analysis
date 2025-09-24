

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
a  };
  marketSentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
  keyTakeaways: string[];
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

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
}

export type Locale = 'vi' | 'en';

export type ChartTimeframe = '7D' | '3M' | '1Y';

export interface DelistingInfo {
    coin: string;
    exchange: string;
    reason: string;
    status: string;
    sourceUrl: string;
}

export interface DelistingUpdate {
    delistings: DelistingInfo[];
    sources: GroundingChunk[];
}

// FIX: Added missing NewsArticle interface.
export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedOn: number;
  url: string;
  imageUrl: string;
}


// Centralized state and action types for the application
export interface AppState {
  status: AppStatus;
  coinInput: string;
  analyzedCoin: string | null;
  priceData7D: PriceDataPoint[];
  priceData3M: PriceDataPoint[];
  priceData1Y: PriceDataPoint[];
  chartTimeframe: ChartTimeframe;
  analysis: AnalysisResult | null;
  tickerData: TickerData | null;
  isAnalysisLoading: boolean; // For primary AI analysis
  error: string | null;
  analysisCache: Record<string, AnalysisResult>;
  isPanelOpen: boolean;
}

export type AppAction =
  | { type: 'START_ANALYSIS'; payload: string }
  | { type: 'SET_ALL_PRICE_DATA', payload: { priceData7D: PriceDataPoint[]; priceData3M: PriceDataPoint[]; priceData1Y: PriceDataPoint[] } }
  | { type: 'SET_CHART_TIMEFRAME', payload: ChartTimeframe }
  | { type: 'SET_ANALYSIS'; payload: { analysis: AnalysisResult; coin: string } }
  | { type: 'USE_CACHED_ANALYSIS'; payload: { analysis: AnalysisResult; coin: string } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'UPDATE_TICKER'; payload: TickerData | null }
  | { type: 'SET_COIN_INPUT'; payload: string }
  | { type: 'TOGGLE_ANALYSIS_PANEL' }
  | { type: 'RESET' };