
// This is a Vercel Serverless Function that acts as a secure proxy to the Google Gemini API.
import { GoogleGenAI, Type } from "@google/genai";

const getDelistingsPrompt = () => {
  return `
    Bạn là một trợ lý chuyên gia về thị trường tiền điện tử, nhiệm vụ của bạn là cung cấp thông tin chính xác và kịp thời.
    Vui lòng liệt kê các loại tiền điện tử và các cặp giao dịch mà sàn Binance đã thông báo sẽ hủy niêm yết gần đây (trong vòng 1-2 tháng tới).

    Đối với mỗi mục, hãy cung cấp:
    1.  'coinPair': Cặp giao dịch bị ảnh hưởng (ví dụ: 'OMG/USDT', 'XEM/BUSD').
    2.  'delistingDate': Ngày hủy niêm yết chính xác theo định dạng 'YYYY-MM-DD'.
    3.  'reason': Một tóm tắt rất ngắn gọn về lý do hủy niêm yết hoặc trích dẫn từ thông báo chính thức (ví dụ: "Không đáp ứng tiêu chuẩn niêm yết", "Do hoán đổi token", "Ngừng hỗ trợ mạng chính").

    YÊU CẦU QUAN TRỌNG:
    - Chỉ bao gồm các thông báo hủy niêm yết sắp diễn ra hoặc vừa diễn ra rất gần đây. Không bao gồm các coin đã bị hủy niêm yết từ nhiều tháng trước.
    - Toàn bộ nội dung văn bản trong phản hồi JSON của bạn PHẢI được viết hoàn toàn bằng tiếng Việt.
    - Cung cấp phản hồi độc quyền ở định dạng JSON có cấu trúc được xác định trong schema. Nếu không tìm thấy thông báo nào gần đây, hãy trả về một mảng JSON rỗng.
  `;
};

const delistingsSchema = {
    type: Type.ARRAY,
    description: "Danh sách các loại tiền điện tử và cặp giao dịch sắp bị Binance hủy niêm yết.",
    items: {
        type: Type.OBJECT,
        properties: {
            coinPair: { type: Type.STRING, description: "Cặp giao dịch bị hủy niêm yết (ví dụ: 'OMG/USDT')." },
            delistingDate: { type: Type.STRING, description: "Ngày hủy niêm yết theo định dạng 'YYYY-MM-DD'." },
            reason: { type: Type.STRING, description: "Lý do ngắn gọn cho việc hủy niêm yết." },
        },
        required: ['coinPair', 'delistingDate', 'reason'],
    }
};


export default async function handler(request, response) {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'Thiếu API Key phía máy chủ. Vui lòng cấu hình biến môi trường API_KEY.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = getDelistingsPrompt();

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: delistingsSchema,
                temperature: 0.1,
            }
        });

        const jsonText = geminiResponse.text.trim();
        const parsedJson = JSON.parse(jsonText);
        
        // Cache for 6 hours
        response.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=43200');
        return response.status(200).json(parsedJson);

    } catch (error) {
        console.error('Gemini API error fetching delistings:', error);
        const errorMessage = error.message || 'Đã xảy ra lỗi máy chủ nội bộ.';
        return response.status(500).json({ error: `Lỗi phía máy chủ: ${errorMessage}` });
    }
}
