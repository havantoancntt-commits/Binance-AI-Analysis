// This is a Vercel Serverless Function that acts as a secure proxy to the Google Gemini API.
// It has been optimized to use the official @google/genai Node.js SDK.

import { GoogleGenAI, Type } from "@google/genai";

/**
 * Calculates the Simple Moving Average (SMA) for a given period.
 * @param {Array<{price: number}>} data - Array of data points.
 * @param {number} period - The number of periods to calculate the SMA over.
 * @returns {number|null} The SMA value or null if not enough data.
 */
const calculateSMA = (data, period) => {
    if (data.length < period) return null;
    const sum = data.slice(-period).reduce((acc, val) => acc + val.price, 0);
    return sum / period;
};

/**
 * Calculates the Relative Strength Index (RSI) using Wilder's smoothing method.
 * @param {Array<{price: number}>} data - Array of data points.
 * @param {number} [period=14] - The RSI period.
 * @returns {number|null} The RSI value or null if not enough data.
 */
const calculateRSI = (data, period = 14) => {
    if (data.length <= period) return null;
    const prices = data.map(p => p.price);
    
    let gains = 0;
    let losses = 0;

    // Initial average
    for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff >= 0) {
            gains += diff;
        } else {
            losses -= diff;
        }
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;

    // Wilder's smoothing
    for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        let currentGain = 0;
        let currentLoss = 0;
        if (diff >= 0) {
            currentGain = diff;
        } else {
            currentLoss = -diff;
        }
        avgGain = (avgGain * (period - 1) + currentGain) / period;
        avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    }

    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
};


const getAnalysisPrompt = (coinPair, data, locale) => {
  const { priceData7D, priceData3M, priceData1Y } = data;

  const latestPrice = priceData7D.length > 0 ? priceData7D[priceData7D.length - 1].price.toFixed(4) : 'N/A';
  
  // Calculate indicators
  const sma20_3M = calculateSMA(priceData3M, 20)?.toFixed(4) || 'N/A';
  const sma50_3M = calculateSMA(priceData3M, 50)?.toFixed(4) || 'N/A';
  const rsi14_3M = calculateRSI(priceData3M, 14)?.toFixed(2) || 'N/A';
  
  const sma20_1Y = calculateSMA(priceData1Y, 20)?.toFixed(4) || 'N/A';
  const sma50_1Y = calculateSMA(priceData1Y, 50)?.toFixed(4) || 'N/A';
  
  const languageInstruction = locale === 'en' 
    ? "All text fields in the final JSON output MUST be in English."
    : "Tất cả các trường văn bản trong JSON output cuối cùng PHẢI bằng tiếng Việt.";

  return `
    **ROLE:** You are a professional quantitative crypto analyst.
    
    **TASK:** Provide a detailed, data-driven technical analysis for the cryptocurrency pair **${coinPair}**.
    Your analysis must be based **exclusively** on the quantitative data provided below. Do not invent any external factors.
    
    **QUANTITATIVE DATA:**
    - Latest Price: ${latestPrice} USDT
    - 3-Month Data Indicators:
        - SMA(20): ${sma20_3M}
        - SMA(50): ${sma50_3M}
        - RSI(14): ${rsi14_3M}
    - 1-Year Data Indicators:
        - SMA(20): ${sma20_1Y}
        - SMA(50): ${sma50_1Y}

    **ANALYSIS & OUTPUT INSTRUCTIONS:**
    1.  **Analyze Trends Step-by-Step:**
        -   **Short-Term Trend (using 3-Month Data):** Is SMA(20) above or below SMA(50)? Is RSI(14) overbought (>70), oversold (<30), or neutral? State the trend (Uptrend, Downtrend, Sideways) and provide a reason based on these indicators.
        -   **Medium-Term Trend (using 3-Month Data):** Synthesize the SMA and RSI data to determine the medium-term outlook.
        -   **Long-Term Trend (using 1-Year Data):** Analyze the SMA(20) vs. SMA(50) crossover. A "Golden Cross" (20 > 50) is bullish. A "Death Cross" (20 < 50) is bearish. State the trend and reason.
    2.  **Determine Key Levels:** Based on the last 90 days of price data, identify 2 support and 2 resistance levels.
    3.  **Formulate a Trading Plan:**
        -   **Buy Zone:** A realistic price range for entry.
        -   **Take Profit Levels:** 2 distinct price targets above the buy zone.
        -   **Stop Loss:** A single price level below the buy zone for risk management.
    4.  **Synthesize Final Recommendation:** Based on your entire analysis, provide a final signal ('Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'Avoid') and a concise reason.
    5.  **Provide Supporting Details:**
        -   **Summary (Strategic Outlook):** A brief paragraph summarizing the overall market position and strategic approach.
        -   **Confidence Score:** A percentage (0-100) representing your confidence in this analysis, with a brief justification.
        -   **Market Driver:** The single most important technical factor driving your analysis (e.g., "RSI is in oversold territory", "A death cross has formed on the daily chart").
        -   **Bull/Bear Cases:** One primary argument for a price increase and one for a price decrease.
        -   **Market Sentiment:** Infer the sentiment from the provided data ('Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed').
        -   **Key Takeaways:** 3-4 bullet points summarizing the most critical points for a trader.
    6.  **Adhere to JSON Output:** You MUST return a single, valid JSON object that strictly follows the provided schema. Do not include any other text, explanations, or markdown.
    7.  **Language:** ${languageInstruction}
  `;
};

const schema = {
  type: Type.OBJECT,
  properties: {
    supportLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    resistanceLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    buyZone: { type: Type.OBJECT, properties: { from: { type: Type.NUMBER }, to: { type: Type.NUMBER } } },
    takeProfitLevels: { type: Type.ARRAY, items: { type: Type.NUMBER } },
    stopLoss: { type: Type.NUMBER },
    trendAnalysis: {
      type: Type.OBJECT,
      properties: {
        shortTerm: { type: Type.OBJECT, properties: { trend: { type: Type.STRING }, reason: { type: Type.STRING } } },
        mediumTerm: { type: Type.OBJECT, properties: { trend: { type: Type.STRING }, reason: { type: Type.STRING } } },
        longTerm: { type: Type.OBJECT, properties: { trend: { type: Type.STRING }, reason: { type: Type.STRING } } },
      }
    },
    confidenceScore: { type: Type.INTEGER },
    confidenceReason: { type: Type.STRING },
    marketDriver: { type: Type.STRING },
    summary: { type: Type.STRING },
    recommendation: { type: Type.OBJECT, properties: { signal: { type: Type.STRING }, reason: { type: Type.STRING } } },
    detailedAnalysis: { type: Type.OBJECT, properties: { bullCase: { type: Type.STRING }, bearCase: { type: Type.STRING } } },
    marketSentiment: { type: Type.STRING },
    keyTakeaways: { type: Type.ARRAY, items: { type: Type.STRING } }
  }
};


export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { coinPair, priceData7D, priceData3M, priceData1Y, locale } = request.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API Key is missing on the server.' });
    }
    if (!coinPair || !priceData7D || !priceData3M || !priceData1Y) {
        return response.status(400).json({ error: 'Missing required data in the request body.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const prompt = getAnalysisPrompt(coinPair, { priceData7D, priceData3M, priceData1Y }, locale);

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                temperature: 0.3,
                // Speed optimization: disable thinking for fastest response
                thinkingConfig: { thinkingBudget: 0 },
            },
        });
        
        const jsonText = geminiResponse.text.trim();
        
        // Cache for 15 minutes
        response.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
        // Vercel requires string responses for serverless functions, not JSON objects directly
        return response.status(200).send(jsonText);

    } catch (error) {
        console.error('Gemini API or internal error:', error);
        const errorMessage = error.message || 'An internal server error occurred.';
        return response.status(500).json({ error: `Server-side error: ${errorMessage}` });
    }
}