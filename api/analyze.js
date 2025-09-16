
// This is a Vercel Serverless Function that acts as a secure proxy to the Google Gemini API.
// It has been optimized to use the official @google/genai Node.js SDK.

import { GoogleGenAI, Type } from "@google/genai";

const getAnalysisPrompt = (coinPair, priceData) => {
  const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 'N/A';
  const dataSnippet = priceData.slice(-60).map(p => `Date: ${p.date}, Price: ${p.price.toFixed(4)}, Vol: ${p.volume.toExponential(2)}`).join('; ');

  return `
    **ROLE & CONTEXT:** You are a senior quantitative analyst at a top-tier hedge fund, specializing in long-term swing trading strategies for cryptocurrencies. Your analysis must be data-driven, precise, and institutional-grade. This is not financial advice.

    **TASK:** Perform a comprehensive technical analysis for ${coinPair} with a long-term perspective (weeks to months). Focus on market structure, key liquidity zones, and risk management. Incorporate advanced indicators like Fibonacci retracements, volume-based support/resistance, and Bollinger Bands, alongside classic indicators (MA, RSI, MACD).

    **DATA:**
    *   **Current Price:** Approx. ${latestPrice}.
    *   **Recent Price Action (last 60 days):** ${dataSnippet}. Use this for short-term trend context.
    *   **Full Dataset (365 days):** Use the entire provided dataset to identify major support/resistance levels.

    **ANALYSIS REQUIREMENTS (Based on the FULL 365-day dataset):**
    1.  **Support Levels:** Two primary support levels below the current price.
    2.  **Resistance Levels:** Two primary resistance levels above the current price.
    3.  **Optimal Buy Zone:** A price range for entry, justified by technical confluence.
    4.  **Take-Profit Targets:** Three realistic take-profit levels.
    5.  **Stop-Loss:** A single, critical stop-loss level.
    6.  **Mid-Term Trend:** The most likely trend (Uptrend, Downtrend, Sideways).
    7.  **Confidence Score:** A 0-100 score for the overall analysis.
    8.  **Confidence Rationale:** A brief reason for the score.
    9.  **Primary Market Driver:** The key technical factor currently in play (e.g., "Breakout from volume-heavy accumulation zone," "Retesting the 200-day MA," "Daily RSI bearish divergence").
    10. **Market Structure Summary:** A single professional sentence summarizing the current market structure.
    11. **Trade Recommendation:** A clear signal ('Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'Avoid') with its core reason.
    12. **Detailed Scenarios:**
        *   **bullCase:** A 2-3 sentence bullish scenario. What needs to happen for the price to rise?
        *   **bearCase:** A 2-3 sentence bearish scenario. What are the key risks?
    13. **Market Sentiment:** The current sentiment based on price action ('Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed').

    **CRITICAL OUTPUT INSTRUCTIONS:**
    *   **Language:** The entire text content in your JSON response MUST be in Vietnamese.
    *   **Format:** Respond ONLY with a JSON object that strictly adheres to the provided schema. Do not include any text before or after the JSON object.
  `;
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        supportLevels: { type: Type.ARRAY, description: "Hai mức giá hỗ trợ chính.", items: { type: Type.NUMBER } },
        resistanceLevels: { type: Type.ARRAY, description: "Hai mức giá kháng cự chính.", items: { type: Type.NUMBER } },
        buyZone: { type: Type.OBJECT, description: "Một phạm vi giá được đề xuất để vào lệnh.", properties: { from: { type: Type.NUMBER }, to: { type: Type.NUMBER } } },
        takeProfitLevels: { type: Type.ARRAY, description: "Ba mức giá chốt lời được đề xuất.", items: { type: Type.NUMBER } },
        stopLoss: { type: Type.NUMBER, description: "Một mức giá dừng lỗ được đề xuất." },
        shortTermTrend: { type: Type.STRING, description: "Xu hướng trung hạn được dự đoán.", enum: ['Uptrend', 'Downtrend', 'Sideways'] },
        confidenceScore: { type: Type.NUMBER, description: "Điểm tin cậy từ 0 đến 100 cho phân tích." },
        confidenceReason: { type: Type.STRING, description: "Lý do ngắn gọn cho điểm tin cậy." },
        marketDriver: { type: Type.STRING, description: "Động lực kỹ thuật chính của thị trường." },
        summary: { type: Type.STRING, description: "Tóm tắt rất ngắn gọn về tâm lý thị trường." },
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
        }
    },
    required: ['supportLevels', 'resistanceLevels', 'buyZone', 'takeProfitLevels', 'stopLoss', 'shortTermTrend', 'confidenceScore', 'confidenceReason', 'marketDriver', 'summary', 'recommendation', 'detailedAnalysis', 'marketSentiment'],
};

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { coinPair, priceData } = request.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'Thiếu API Key phía máy chủ. Vui lòng cấu hình biến môi trường API_KEY.' });
    }

    if (!coinPair || !priceData) {
        return response.status(400).json({ error: 'Cặp coin và dữ liệu giá không được tìm thấy trong yêu cầu.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = getAnalysisPrompt(coinPair, priceData);

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.2,
            }
        });

        const jsonText = geminiResponse.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        return response.status(200).json(parsedJson);

    } catch (error) {
        console.error('Gemini API or internal error:', error);
        const errorMessage = error.message || 'Đã xảy ra lỗi máy chủ nội bộ.';
        return response.status(500).json({ error: `Lỗi phía máy chủ: ${errorMessage}` });
    }
}