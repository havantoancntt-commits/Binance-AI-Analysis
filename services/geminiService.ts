import { GoogleGenAI, Type } from "@google/genai";
import type { PriceDataPoint, AnalysisResult } from '../types';

// IMPORTANT: This key is managed externally and assumed to be available in the environment.
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("BIẾN MÔI TRƯỜNG API_KEY CHƯA ĐƯỢC CẤU HÌNH. Vui lòng thiết lập khóa API trong cài đặt Vercel của bạn.");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });


const getAnalysisPrompt = (coinPair: string, priceData: PriceDataPoint[]): string => {
  const latestPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 'N/A';
  const dataSnippet = priceData.slice(-60).map(p => `Date: ${p.date}, Price: ${p.price}, Volume: ${p.volume}`).join('; ');

  return `
    Bạn là một nhà phân tích định lượng chuyên nghiệp tại một quỹ phòng hộ hàng đầu, chuyên về chiến lược giao dịch swing dài hạn trên thị trường tiền điện tử.
    Phân tích của bạn phải cực kỳ chính xác, dựa trên dữ liệu và không chứa cảm tính. Bạn không đưa ra lời khuyên tài chính.
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

    YÊU CẦU NGHIÊM NGẶT: Toàn bộ nội dung văn bản trong phản hồi JSON của bạn PHẢI được viết hoàn toàn bằng tiếng Việt.

    Cung cấp phản hồi độc quyền ở định dạng JSON có cấu trúc được xác định trong schema. Không thêm bất kỳ văn bản nào trước hoặc sau đối tượng JSON.
  `;
};

const analysisSchema = {
  type: Type.OBJECT,
  properties: {
    supportLevels: {
      type: Type.ARRAY,
      description: "Hai mức giá hỗ trợ chính.",
      items: { type: Type.NUMBER },
    },
    resistanceLevels: {
      type: Type.ARRAY,
      description: "Hai mức giá kháng cự chính.",
      items: { type: Type.NUMBER },
    },
    buyZone: {
      type: Type.OBJECT,
      description: "Một phạm vi giá được đề xuất để vào lệnh.",
      properties: {
        from: { type: Type.NUMBER },
        to: { type: Type.NUMBER },
      },
    },
    takeProfitLevels: {
      type: Type.ARRAY,
      description: "Ba mức giá chốt lời được đề xuất.",
      items: { type: Type.NUMBER },
    },
    stopLoss: {
      type: Type.NUMBER,
      description: "Một mức giá dừng lỗ được đề xuất.",
    },
    shortTermTrend: {
        type: Type.STRING,
        description: "Xu hướng trung hạn được dự đoán.",
        enum: ['Uptrend', 'Downtrend', 'Sideways'],
    },
    confidenceScore: {
        type: Type.NUMBER,
        description: "Điểm tin cậy từ 0 đến 100 cho phân tích.",
    },
    confidenceReason: {
        type: Type.STRING,
        description: "Lý do ngắn gọn cho điểm tin cậy.",
    },
    marketDriver: {
        type: Type.STRING,
        description: "Động lực kỹ thuật chính của thị trường.",
    },
    summary: {
        type: Type.STRING,
        description: "Tóm tắt rất ngắn gọn về tâm lý thị trường.",
    },
    recommendation: {
      type: Type.OBJECT,
      description: "Khuyến nghị giao dịch cuối cùng với tín hiệu và lý do.",
      properties: {
        signal: {
          type: Type.STRING,
          enum: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'Avoid'],
        },
        reason: { type: Type.STRING },
      },
      required: ['signal', 'reason'],
    },
    detailedAnalysis: {
      type: Type.OBJECT,
      description: "Phân tích chi tiết về các kịch bản có thể xảy ra.",
      properties: {
          bullCase: { 
              type: Type.STRING,
              description: "Kịch bản và các yếu tố hỗ trợ cho xu hướng tăng giá."
          },
          bearCase: { 
              type: Type.STRING,
              description: "Kịch bản, rủi ro và các yếu tố hỗ trợ cho xu hướng giảm giá."
          },
      },
      required: ['bullCase', 'bearCase'],
    }
  },
  required: ['supportLevels', 'resistanceLevels', 'buyZone', 'takeProfitLevels', 'stopLoss', 'shortTermTrend', 'confidenceScore', 'confidenceReason', 'marketDriver', 'summary', 'recommendation', 'detailedAnalysis'],
};


export const getAIAnalysis = async (coinPair: string, priceData: PriceDataPoint[]): Promise<AnalysisResult> => {
  try {
    const prompt = getAnalysisPrompt(coinPair, priceData);
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, 
      },
    });

    const text = response.text.trim();
    const parsedJson = JSON.parse(text);

    // A simple validation to ensure the core structure is present
    if (!parsedJson.supportLevels || !parsedJson.recommendation || !parsedJson.takeProfitLevels || !parsedJson.detailedAnalysis?.bullCase) {
      throw new Error("Cấu trúc JSON không hợp lệ hoặc không đầy đủ nhận được từ API.");
    }

    return parsedJson as AnalysisResult;
  } catch (error) {
    console.error("Error fetching AI analysis:", error);
    if (error instanceof Error && error.message.includes('JSON')) {
        throw new Error("Đã xảy ra lỗi khi xử lý phản hồi từ AI. Vui lòng thử lại.");
    }
    throw new Error("Không thể nhận phân tích từ AI. Vui lòng thử lại sau.");
  }
};