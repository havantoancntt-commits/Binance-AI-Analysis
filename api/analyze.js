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

  // Helper to safely get the latest price
  const getLatestPrice = (d) => d.length > 0 ? d[d.length - 1].price : 0;
  const latestPrice = getLatestPrice(priceData7D) || getLatestPrice(priceData3M) || getLatestPrice(priceData1Y);

  // Helper to format indicators
  const formatIndicator = (name, value, decimals = 2) => value ? `${name}=${value.toFixed(decimals)}` : `${name}=N/A`;
  
  // Calculate indicators for each timeframe
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
    **VAI TRÒ:** Bạn là một nhà phân tích kỹ thuật thị trường tài chính chuyên nghiệp, dày dạn kinh nghiệm. Nhiệm vụ của bạn là thực hiện một phân tích đa khung thời gian toàn diện. Mục tiêu cuối cùng là cung cấp một dự báo chính xác và một kế hoạch giao dịch khả thi.

    **NHIỆM VỤ:** Thực hiện phân tích kỹ thuật chuyên sâu cho ${coinPair} bằng cách sử dụng dữ liệu từ các khung thời gian khác nhau (1 năm, 3 tháng, 7 ngày) được cung cấp. Tổng hợp những phát hiện của bạn vào một triển vọng chiến lược duy nhất.

    **BỐI CẢNH DỮ LIỆU THỊ TRƯỜNG:**
    *   **Tài sản:** ${coinPair}
    *   **Giá hiện tại:** ~${latestPrice.toFixed(4)}
    *   **Bối cảnh Dài hạn (1 năm):**
        *   Phạm vi: ${formatIndicator('Low', indicators1Y.low, 4)} - ${formatIndicator('High', indicators1Y.high, 4)}
        *   Các đường SMA chính: ${formatIndicator('200D', indicators1Y.sma200, 4)}, ${formatIndicator('100D', indicators1Y.sma100, 4)}
    *   **Bối cảnh Trung hạn (3 tháng):**
        *   Các chỉ báo chính: ${formatIndicator('SMA50', indicators3M.sma50, 4)}, ${formatIndicator('RSI(14)', indicators3M.rsi14)}
    *   **Hành động giá Ngắn hạn (7 ngày):**
        *   Phân tích cấu trúc thị trường gần đây, các mẫu hình nến và biến động giá trong tuần qua.

    **HƯỚNG DẪN ĐẦU RA:**
    1.  **Phân tích tổng hợp:** Xem xét tất cả dữ liệu trên các khung thời gian. Xu hướng dài hạn cho bối cảnh, xu hướng trung hạn cho động lượng, và xu hướng ngắn hạn cho điểm vào lệnh.
    2.  **Điền vào Schema:** Điền vào TẤT CẢ các trường trong schema JSON bắt buộc. Tất cả các mức giá (hỗ trợ, kháng cự, v.v.) phải dựa trên phân tích tổng hợp này.
    3.  **Dự báo xu hướng:** Cung cấp một dự báo xu hướng ('Uptrend', 'Downtrend', 'Sideways') và một lý do NGẮN GỌN cho mỗi khung thời gian (ngắn, trung, dài hạn).
    4.  **Điểm mấu chốt:** Xác định ba điểm quan trọng nhất từ phân tích của bạn.
    5.  **Ngôn ngữ:** Toàn bộ văn bản đầu ra trong JSON PHẢI bằng **tiếng Việt**.
    6.  **Định dạng:** Bạn PHẢI trả lời CHỈ với một đối tượng JSON hợp lệ duy nhất tuân thủ nghiêm ngặt schema. KHÔNG có văn bản, giải thích hoặc markdown nào khác.
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
