
export interface PriceDataPoint {
  date: string;
  price: number;
  volume: number;
}

export interface Recommendation {
  signal: 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell' | 'Avoid';
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
  shortTermTrend: 'Uptrend' | 'Downtrend' | 'Sideways';
  confidenceScore: number;
  confidenceReason: string;
  marketDriver: string;
  summary: string;
  recommendation: Recommendation;
  detailedAnalysis: {
    bullCase: string;
    bearCase: string;
  };
  marketSentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Greed' | 'Extreme Greed';
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

export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedOn: number;
  url: string;
  imageUrl: string;
}

// FIX: Add DelistingCoin interface to fix import error.
export interface DelistingCoin {
  coinPair: string;
  delistingDate: string;
  reason: string;
}

export type Timeframe = '1D' | '7D' | '1M' | '1Y';