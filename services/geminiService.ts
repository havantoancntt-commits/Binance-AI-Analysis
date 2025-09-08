import type { PriceDataPoint, AnalysisResult } from '../types';

export const fetchAIAnalysis = async (coinPair: string, priceData: PriceDataPoint[]): Promise<AnalysisResult> => {
  try {
    const apiResponse = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ coinPair, priceData }),
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Phản hồi không hợp lệ từ máy chủ.' }));
        throw new Error(errorData.error || 'Lỗi giao tiếp với máy chủ phân tích.');
    }

    const analysisResult: AnalysisResult = await apiResponse.json();

    if (!analysisResult.supportLevels || !analysisResult.recommendation || !analysisResult.detailedAnalysis) {
      throw new Error("Cấu trúc dữ liệu phân tích không hợp lệ nhận được từ máy chủ.");
    }

    return analysisResult;
  } catch (error) {
    console.error("Error fetching AI analysis via proxy:", error);
    throw error;
  }
};
