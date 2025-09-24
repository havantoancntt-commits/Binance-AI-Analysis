// This is a Vercel Serverless Function that acts as a secure proxy 
// to the Google Gemini API for multimodal (image + text) analysis.

import { GoogleGenAI } from "@google/genai";

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { imageData, locale = 'vi' } = request.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API Key is missing on the server.' });
    }
    if (!imageData) {
        return response.status(400).json({ error: 'Missing imageData in the request body.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        const languageInstruction = locale === 'en' ? "Your entire response must be in English." : "Toàn bộ phản hồi của bạn phải bằng tiếng Việt.";

        const prompt = `
            You are an expert technical analyst. This image is a snapshot of a cryptocurrency price chart. 
            Analyze it and provide a concise summary of the most important technical observations. 
            Identify key patterns (e.g., head and shoulders, double top), trend direction, significant support/resistance levels, and volume indicators. 
            Present your findings as a list of bullet points in markdown format. 
            Be direct and focus only on what is visible in the image. ${languageInstruction}
        `;

        const imagePart = {
          inlineData: {
            mimeType: 'image/jpeg',
            data: imageData,
          },
        };
        
        const textPart = { text: prompt };

        const geminiResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [imagePart, textPart] },
        });

        const analysisText = geminiResponse.text.trim();
        
        return response.status(200).json({ analysis: analysisText });

    } catch (error) {
        console.error('Gemini API or internal error:', error);
        const errorMessage = error.message || 'An internal server error occurred.';
        return response.status(500).json({ error: `Server-side error: ${errorMessage}` });
    }
}