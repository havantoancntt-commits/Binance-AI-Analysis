
import type { DelistingCoin } from '../types';

export const fetchDelistings = async (): Promise<DelistingCoin[]> => {
  try {
    const response = await fetch('/api/delistings');
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Lỗi khi lấy danh sách hủy niêm yết: ${response.status}`);
    }
    const data: DelistingCoin[] = await response.json();
    return data;
  } catch (error) {
    console.error("Lỗi khi tìm nạp danh sách hủy niêm yết:", error);
    // Return empty array for non-critical failures
    return [];
  }
};
