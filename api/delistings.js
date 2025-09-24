// This is a Vercel Serverless Function that uses Gemini with Google Search
// grounding to find recent news about cryptocurrency delistings.

import { GoogleGenAI } from "@google/genai";

const getDelistingPrompt = (locale) => {
    const languageInstruction = locale === 'en' 
        ? "The text in the 'reason' and 'status' fields MUST be in English."
        : "The text in the 'reason' and 'status' fields MUST be in Vietnamese.";

    return `
      **ROLE:** You are a crypto market intelligence analyst. Your task is to find official announcements and credible news about delistings.
      
      **TASK:** Using Google Search, find official announcements or credible news reports from the last 30 days about cryptocurrency delistings, trading suspensions, or removals on major exchanges (like Binance, Coinbase, KuCoin, OKX). 
      
      **OUTPUT INSTRUCTIONS:**
      1.  For each finding, provide the cryptocurrency ticker, the exchange name, a brief one-sentence summary of the reason, the current status (e.g., 'Delisted on YYYY-MM-DD', 'Suspended Indefinitely'), and the source URL.
      2.  ${languageInstruction}
      3.  You MUST return the result as a valid JSON object. This object should contain a single key "delistings", which is an array of objects.
      4.  Each object in the array must have the following keys: "coin", "exchange", "reason", "status", "sourceUrl".
      5.  If no delistings are found, return an empty array for the "delistings" key.
      6.  Do NOT include any other text, explanations, or markdown in your response. The response must be ONLY the JSON object.
    `;
};


export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method Not Allowed' });
    }

    const { locale = 'vi' } = request.body;
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
        return response.status(500).json({ error: 'API Key is missing on the server.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = getDelistingPrompt(locale);

        const geminiResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                temperature: 0.1,
            }
        });

        const jsonText = geminiResponse.text.trim();
        
        let parsedJson;
        try {
            parsedJson = JSON.parse(jsonText);
        } catch (e) {
            console.error("Failed to parse Gemini response as JSON:", jsonText);
            // Attempt to recover if the model wrapped the JSON in markdown
            const match = jsonText.match(/```json\n([\s\S]*?)\n```/);
            if (match && match[1]) {
                 parsedJson = JSON.parse(match[1]);
            } else {
                throw new Error("AI response was not valid JSON.");
            }
        }
        
        // Ensure the response has the expected structure
        if (!parsedJson || !Array.isArray(parsedJson.delistings)) {
            throw new Error("Parsed JSON does not have the expected structure with a 'delistings' array.");
        }
        
        const groundingChunks = geminiResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

        const finalResponse = {
            delistings: parsedJson.delistings,
            sources: groundingChunks,
        };
        
        // Cache for 4 hours
        response.setHeader('Cache-Control', 's-maxage=14400, stale-while-revalidate=28800');
        return response.status(200).json(finalResponse);

    } catch (error) {
        console.error('Gemini API or internal error:', error);
        const errorMessage = error.message || 'An internal server error occurred.';
        return response.status(500).json({ error: `Server-side error: ${errorMessage}` });
    }
}