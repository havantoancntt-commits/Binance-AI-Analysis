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

export const fetchDelistingWatchlist = async (): Promise<DelistingCoin[]> => {
  try {
    const apiResponse = await fetch('/api/delisting', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        try {
            const errorData = JSON.parse(errorText);
            throw new Error(errorData.error || 'Lỗi giao tiếp với máy chủ lấy danh sách hủy niêm yết.');
        } catch (e) {
            throw new Error(`Phản hồi máy chủ không hợp lệ (${apiResponse.status}): ${errorText.substring(0, 150)}`);
        }
    }

    const delistingData: DelistingCoin[] = await apiResponse.json();
    return delistingData;

  } catch (error) {
    console.error("Lỗi khi tìm nạp danh sách theo dõi hủy niêm yết qua proxy:", error);
    throw error;
  }
};