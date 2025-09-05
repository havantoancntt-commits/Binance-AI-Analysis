// This is a Vercel Serverless Function that acts as a secure proxy to the Google Gemini API.

const analysisSchema = {
    type: 'OBJECT',
    properties: {
        supportLevels: {
            type: 'ARRAY',
            description: "Hai mức giá hỗ trợ chính.",
            items: { type: 'NUMBER' },
        },
        resistanceLevels: {
            type: 'ARRAY',
            description: "Hai mức giá kháng cự chính.",
            items: { type: 'NUMBER' },
        },
        buyZone: {
            type: 'OBJECT',
            description: "Một phạm vi giá được đề xuất để vào lệnh.",
            properties: {
                from: { type: 'NUMBER' },
                to: { type: 'NUMBER' },
            },
        },
        takeProfitLevels: {
            type: 'ARRAY',
            description: "Ba mức giá chốt lời được đề xuất.",
            items: { type: 'NUMBER' },
        },
        stopLoss: {
            type: 'NUMBER',
            description: "Một mức giá dừng lỗ được đề xuất.",
        },
        shortTermTrend: {
            type: 'STRING',
            description: "Xu hướng trung hạn được dự đoán.",
            enum: ['Uptrend', 'Downtrend', 'Sideways'],
        },
        confidenceScore: {
            type: 'NUMBER',
            description: "Điểm tin cậy từ 0 đến 100 cho phân tích.",
        },
        confidenceReason: {
            type: 'STRING',
            description: "Lý do ngắn gọn cho điểm tin cậy.",
        },
        marketDriver: {
            type: 'STRING',
            description: "Động lực kỹ thuật chính của thị trường.",
        },
        summary: {
            type: 'STRING',
            description: "Tóm tắt rất ngắn gọn về tâm lý thị trường.",
        },
        recommendation: {
            type: 'OBJECT',
            description: "Khuyến nghị giao dịch cuối cùng với tín hiệu và lý do.",
            properties: {
                signal: {
                    type: 'STRING',
                    enum: ['Strong Buy', 'Buy', 'Hold', 'Sell', 'Strong Sell', 'Avoid'],
                },
                reason: { type: 'STRING' },
            },
            required: ['signal', 'reason'],
        },
        detailedAnalysis: {
            type: 'OBJECT',
            description: "Phân tích chi tiết về các kịch bản có thể xảy ra.",
            properties: {
                bullCase: {
                    type: 'STRING',
                    description: "Kịch bản và các yếu tố hỗ trợ cho xu hướng tăng giá."
                },
                bearCase: {
                    type: 'STRING',
                    description: "Kịch bản, rủi ro và các yếu tố hỗ trợ cho xu hướng giảm giá."
                },
            },
            required: ['bullCase', 'bearCase'],
        }
    },
    required: ['supportLevels', 'resistanceLevels', 'buyZone', 'takeProfitLevels', 'stopLoss', 'shortTermTrend', 'confidenceScore', 'confidenceReason', 'marketDriver', 'summary', 'recommendation', 'detailedAnalysis'],
};

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { prompt } = request.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        // This check now runs on the server, where it should pass in your Vercel environment.
        return response.status(500).json({ error: 'Thiếu API Key phía máy chủ. Vui lòng cấu hình biến môi trường API_KEY trong cài đặt Vercel.' });
    }

    if (!prompt) {
        return response.status(400).json({ error: 'Prompt không được tìm thấy trong yêu cầu.' });
    }

    try {
        const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        
        const geminiResponse = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: analysisSchema,
                    temperature: 0.2,
                }
            })
        });

        const responseData = await geminiResponse.json();

        if (!geminiResponse.ok) {
            console.error('Gemini API Error:', responseData);
            const errorMessage = responseData?.error?.message || 'Lỗi không xác định từ Gemini API.';
            return response.status(geminiResponse.status).json({ error: `Lỗi Gemini API: ${errorMessage}` });
        }
        
        // The REST API response structure has the JSON string inside candidates -> content -> parts -> text
        const textContent = responseData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
             throw new Error("Không tìm thấy nội dung văn bản trong phản hồi từ Gemini API.");
        }
        
        // The response text is a JSON string, so parse it before sending it back to the client
        const parsedJson = JSON.parse(textContent);

        // Set cache headers to prevent stale data but allow caching for short periods
        response.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
        
        return response.status(200).json(parsedJson);

    } catch (error) {
        console.error('Internal Server Error:', error);
        return response.status(500).json({ error: error.message || 'Đã xảy ra lỗi máy chủ nội bộ.' });
    }
}
