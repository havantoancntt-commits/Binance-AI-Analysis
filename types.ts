
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

// FIX: Add missing NewsArticle interface.
export interface NewsArticle {
  id: string;
  title: string;
  source: string;
  publishedOn: number;
  url: string;
  imageUrl: string;
}

// FIX: Add missing DelistingCoin interface.
export interface DelistingCoin {
  coinPair: string;
  delistingDate: string;
  reason: string;
}
