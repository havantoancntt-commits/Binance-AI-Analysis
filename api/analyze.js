
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

const getAnalysisPrompt = (coinPair, data) => {
  const { priceData7D, priceData3M, priceData1Y } = data;

  const getLatestPrice = (d) => d.length > 0 ? d[d.length - 1].price : 0;
  const latestPrice = getLatestPrice(priceData7D) || getLatestPrice(priceData3M) || getLatestPrice(priceData1Y);
  const formatIndicator = (name, value, decimals = 2) => value ? `${name}=${value.toFixed(decimals)}` : `${name}=N/A`;
  
  const indicators1Y = {
    high: Math.max(...priceData1Y.map(p => p.price)),
    low: Math.min(...priceData1Y.map(p => p.price)),
    sma200: calculateSMA(priceData1Y, 200),
    sma100: calculateSMA(priceData1Y, 100),
  };
  const indicators3M = {
    sma50: calculateSMA(priceData3M, 50),
    rsi14: calculateRSI(priceData3M, 14),
  };

  return `
    **ROLE:** You are an expert financial market technical analyst. Your mission is to perform a comprehensive, multi-timeframe analysis to provide a precise forecast and an actionable trading plan.

    **TASK:** Conduct an in-depth technical analysis for ${coinPair} using the provided multi-timeframe data. Synthesize your findings into a single, coherent strategic outlook.

    **MARKET DATA CONTEXT:**
    *   **Asset:** ${coinPair}
    *   **Current Price:** ~${latestPrice.toFixed(4)}
    *   **Long-Term Context (1-Year):**
        *   Range: ${formatIndicator('Low', indicators1Y.low, 4)} - ${formatIndicator('High', indicators1Y.high, 4)}
        *   Key SMAs: ${formatIndicator('200D', indicators1Y.sma200, 4)}, ${formatIndicator('100D', indicators1Y.sma100, 4)}
    *   **Mid-Term Context (3-Month):**
        *   Key Indicators: ${formatIndicator('SMA50', indicators3M.sma50, 4)}, ${formatIndicator('RSI(14)', indicators3M.rsi14)}
    *   **Short-Term Price Action (7-Day):**
        *   Analyze the recent market structure, candlestick patterns, and price volatility from the past week's data.

    **OUTPUT INSTRUCTIONS:**
    1.  **Synthesize Analysis:** Consider all timeframes. Use the long-term for context, mid-term for momentum, and short-term for entry points.
    2.  **Populate Schema:** Fill in ALL fields in the required JSON schema based on your synthesized analysis. All price levels must be derived from this analysis.
    3.  **Trend Forecast:** Provide a trend forecast ('Uptrend', 'Downtrend', 'Sideways') and a BRIEF reason for each timeframe (short, medium, long).
    4.  **Key Takeaways:** Identify the three most critical takeaways from your analysis.
    5.  **Language:** The entire text output within the JSON MUST be in **Vietnamese**.
    6.  **Format:** You MUST respond with ONLY a single, valid JSON object that strictly adheres to the schema. NO other text, explanations, or markdown.
  `;
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        supportLevels: { type: Type.ARRAY, description: "Hai mức giá hỗ trợ chính.", items: { type: Type.NUMBER } },
        resistanceLevels: { type: Type.ARRAY, description: "Hai mức giá kháng cự chính.", items: { type: Type.NUMBER } },
        buyZone: { type: Type.OBJECT, description: "Một phạm vi giá được đề xuất để vào lệnh.", properties: { from: { type: Type.NUMBER }, to: { type: Type.NUMBER } }, required: ['from', 'to'] },
        takeProfitLevels: { type: Type.ARRAY, description: "Ba mức giá chốt lời được đề xuất.", items: { type: Type.NUMBER } },
        stopLoss: { type: Type.NUMBER, description: "Một mức giá dừng lỗ được đề xuất." },
        trendAnalysis: {
            type: Type.OBJECT,
            description: "Phân tích xu hướng đa khung thời gian.",
            properties: {
                shortTerm: { type: Type.OBJECT, properties: { trend: { type: Type.STRING, enum: ['Uptrend', 'Downtrend', 'Sideways']}, reason: { type: Type.STRING } }, required: ['trend', 'reason'] },
                mediumTerm: { type: Type.OBJECT, properties: { trend: { type: Type.STRING, enum: ['Uptrend', 'Downtrend', 'Sideways']}, reason: { type: Type.STRING } }, required: ['trend', 'reason'] },
                longTerm: { type: Type.OBJECT, properties: { trend: { type: Type.STRING, enum: ['Uptrend', 'Downtrend', 'Sideways']}, reason: { type: Type.STRING } }, required: ['trend', 'reason'] },
            },
            required: ['shortTerm', 'mediumTerm', 'longTerm'],
        },
        confidenceScore: { type: Type.NUMBER, description: "Điểm tin cậy từ 0 đến 100 cho phân tích." },
        confidenceReason: { type: Type.STRING, description: "Lý do ngắn gọn cho điểm tin cậy." },
        marketDriver: { type: Type.STRING, description: "Động lực kỹ thuật chính của thị trường." },
        summary: { type: Type.STRING, description: "Triển vọng chiến lược tổng hợp kết hợp các khung thời gian." },
        recommendation: {
            type: Type.OBJECT,
            description: "Khuyến nghị giao dịch cuối cùng với tín hiệu và lý do.",
            properties: {
                signal: { type: Type.STRING, enum: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'Avoid'] },
                reason: { type: Type.STRING },
            },
            required: ['signal', 'reason'],
        },
        detailedAnalysis: {
            type: Type.OBJECT,
            description: "Phân tích chi tiết về các kịch bản có thể xảy ra.",
            properties: {
                bullCase: { type: Type.STRING, description: "Kịch bản và các yếu tố hỗ trợ cho xu hướng tăng giá." },
                bearCase: { type: Type.STRING, description: "Kịch bản, rủi ro và các yếu tố hỗ trợ cho xu hướng giảm giá." },
            },
            required: ['bullCase', 'bearCase'],
        },
        marketSentiment: {
            type: Type.STRING,
            description: "Tâm lý thị trường hiện tại dựa trên hành động giá.",
            enum: ['Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed']
        },
        keyTakeaways: { type: Type.ARRAY, description: "Ba điểm quan trọng nhất từ phân tích.", items: { type: Type.STRING } },
    },
    required: ['supportLevels', 'resistanceLevels', 'buyZone', 'takeProfitLevels', 'stopLoss', 'trendAnalysis', 'confidenceScore', 'confidenceReason', 'marketDriver', 'summary', 'recommendation', 'detailedAnalysis', 'marketSentiment', 'keyTakeaways'],
};

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { coinPair, priceData7D, priceData3M, priceData1Y } = request.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'Thiếu API Key phía máy chủ. Vui lòng cấu hình biến môi trường API_KEY.' });
    }

    if (!coinPair || !priceData1Y || !priceData3M || !priceData7D) {
        return response.status(400).json({ error: 'Thiếu dữ liệu giá cho một hoặc nhiều khung thời gian.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = getAnalysisPrompt(coinPair, { priceData7D, priceData3M, priceData1Y });

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.2, 
                topK: 5,
                thinkingConfig: { thinkingBudget: 0 },
            }
        });

        const jsonText = geminiResponse.text.trim();
        
        let parsedJson;
        try {
            parsedJson = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", jsonText);
            throw new Error("Phản hồi AI không phải là JSON hợp lệ.");
        }
        
        response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        return response.status(200).json(parsedJson);

    } catch (error) {
        console.error('Gemini API or internal error:', error);
        const errorMessage = error.message || 'Đã xảy ra lỗi máy chủ nội bộ.';
        return response.status(500).json({ error: `Lỗi phía máy chủ: ${errorMessage}` });
    }
}
