import type { DelistingUpdate, Locale } from '../types';

/**
 * Fetches the latest delisting information using the serverless function.
 * @param locale The language for the response text.
 * @returns A promise that resolves to an object containing delistings and sources.
 */
export const fetchDelistings = async (locale: Locale): Promise<DelistingUpdate> => {
  try {
    const apiResponse = await fetch('/api/delistings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale }),
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${apiResponse.status}`);
    }
    
    const data: DelistingUpdate = await apiResponse.json();

    if (!data || !Array.isArray(data.delistings)) {
      throw new Error("Invalid data structure received from delistings API.");
    }

    return data;
  } catch (error: any) {
    console.error("Error fetching delistings:", error);
    throw new Error(error.message || 'Failed to fetch delisting information.');
  }
};