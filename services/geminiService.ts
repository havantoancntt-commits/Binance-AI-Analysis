
import type { PriceDataPoint, AnalysisResult, Locale } from '../types';

export interface MultiTimeframePriceData {
    priceData7D: PriceDataPoint[];
    priceData3M: PriceDataPoint[];
    priceData1Y: PriceDataPoint[];
}

export const fetchAIAnalysis = async (coinPair: string, priceData: MultiTimeframePriceData, locale: Locale): Promise<AnalysisResult> => {
  try {
    const apiResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coinPair, ...priceData, locale }),
    });

    if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Lỗi giao tiếp với máy chủ phân tích.');
        } catch (e) {
            throw new Error(`Phản hồi máy chủ không hợp lệ (${apiResponse.status}): ${errorText.substring(0, 150)}`);
        }
    }
    
    const responseText = await apiResponse.text();
    let analysisResult: AnalysisResult;
    try {
        analysisResult = JSON.parse(responseText);
    } catch(e) {
        console.error("Lỗi phân tích cú pháp JSON phân tích:", responseText);
        throw new Error("Phản hồi phân tích từ AI không phải là JSON hợp lệ.");
    }

    if (!analysisResult.supportLevels || !analysisResult.recommendation || !analysisResult.detailedAnalysis) {
      throw new Error("Cấu trúc dữ liệu phân tích không hợp lệ nhận được từ máy chủ.");
    }

    return analysisResult;
  } catch (error) {
    console.error("Lỗi khi tìm nạp phân tích AI qua proxy:", error);
    throw error;
  }
};