// This is a Vercel Serverless Function that acts as a secure proxy to the Google Gemini API.
// It has been optimized to use the official @google/genai Node.js SDK.

import { GoogleGenAI, Type } from "@google/genai";

const getAnalysisPrompt = (coinPair, priceData) => {
  const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 'N/A';
  const dataSnippet = priceData.slice(-60).map(p => `Date: ${p.date}, Price: ${p.price}, Volume: ${p.volume}`).join('; ');

  return `
    Bạn là một nhà phân tích định lượng cấp cao tại một quỹ phòng hộ hàng đầu, chuyên về chiến lược giao dịch swing dài hạn trên thị trường tiền điện tử.
    Phân tích của bạn phải cực kỳ chính xác, dựa trên dữ liệu, và mang tính chuyên nghiệp của cấp độ tổ chức. Bạn không đưa ra lời khuyên tài chính.
    Nhiệm vụ của bạn là thực hiện phân tích kỹ thuật toàn diện cho cặp tiền ${coinPair} từ góc độ dài hạn (vài tuần đến vài tháng), tập trung vào cấu trúc thị trường, các vùng thanh khoản quan trọng và quản lý rủi ro.

    Trong phân tích của mình, hãy suy luận và kết hợp các chỉ báo kỹ thuật nâng cao như các mức Fibonacci retracement, dải Bollinger, các vùng hỗ trợ/kháng cự dựa trên khối lượng giao dịch (Volume Profile), cùng với các chỉ báo cổ điển như MA, RSI và MACD.

    Giá hiện tại là khoảng ${latestPrice}.
    Đây là dữ liệu hành động giá gần đây (60 ngày qua, từ cũ nhất đến mới nhất): ${dataSnippet}
    Hãy coi trọng dữ liệu gần đây này để xác định xu hướng ngắn hạn, nhưng hãy sử dụng toàn bộ dữ liệu 365 ngày để xác định các mức hỗ trợ/kháng cự chính.

    Dựa trên TOÀN BỘ dữ liệu lịch sử được cung cấp (365 ngày), hãy thực hiện phân tích giao dịch swing dài hạn. Xác định những điều sau:
    1.  Hai mức hỗ trợ chính dưới mức giá hiện tại.
    2.  Hai mức kháng cự chính trên mức giá hiện tại.
    3.  Một vùng mua/vào lệnh tối ưu, nơi có sự hội tụ của nhiều yếu tố kỹ thuật.
    4.  Ba mục tiêu chốt lời thực tế.
    5.  Một mức dừng lỗ quan trọng duy nhất.
    6.  Xu hướng trung hạn có khả năng xảy ra (Uptrend, Downtrend, hoặc Sideways).
    7.  Điểm số tự tin (từ 0 đến 100) cho toàn bộ phân tích.
    8.  Lý do ngắn gọn cho điểm số tự tin.
    9.  Động lực chính của thị trường (ví dụ: "Sự phá vỡ vùng tích lũy với khối lượng lớn", "Giá đang kiểm tra lại đường MA 200", "Phân kỳ giảm giá RSI trên khung ngày").
    10. Một câu tóm tắt chuyên nghiệp về cấu trúc thị trường hiện tại.
    11. Một khuyến nghị giao dịch rõ ràng với một tín hiệu cụ thể ('Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'Avoid') và lý do.
    12. Một phân tích chi tiết, cân bằng bao gồm hai phần:
        - bullCase: Giải thích kịch bản tăng giá (2-3 câu). Điều gì cần xảy ra để giá tăng?
        - bearCase: Giải thích kịch bản giảm giá (2-3 câu). Rủi ro chính là gì và điều gì sẽ làm mất hiệu lực của luận điểm tăng giá?
    13. Tâm lý thị trường hiện tại dựa trên hành động giá gần đây ('Extreme Fear', 'Fear', 'Neutral', 'Greed', 'Extreme Greed').

    YÊU CẦU NGHIÊM NGẶT: Toàn bộ nội dung văn bản trong phản hồi JSON của bạn PHẢI được viết hoàn toàn bằng tiếng Việt.

    Cung cấp phản hồi độc quyền ở định dạng JSON có cấu trúc được xác định trong schema. Không thêm bất kỳ văn bản nào trước hoặc sau đối tượng JSON.
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
            contents: { parts: [{ text: prompt }] },
            config: {
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.2,
                thinkingConfig: { thinkingBudget: 0 },
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