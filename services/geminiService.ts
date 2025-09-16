import type { PriceDataPoint, AnalysisResult, DelistingCoin } from '../types';

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

export const fetchDelistingWatchlist = async (): Promise<DelistingCoin[]> => {
  try {
    const apiResponse = await fetch('/api/delistings', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ error: 'Phản hồi không hợp lệ từ máy chủ.' }));
        throw new Error(errorData.error || 'Lỗi giao tiếp với máy chủ lấy danh sách hủy niêm yết.');
    }

    const delistingData: DelistingCoin[] = await apiResponse.json();
    return delistingData;

  } catch (error) {
    console.error("Error fetching delisting watchlist via proxy:", error);
    // Return empty array on failure so it doesn't break the UI
    return [];
  }
};
