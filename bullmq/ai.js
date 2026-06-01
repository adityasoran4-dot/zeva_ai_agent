/*
 * GENERATE AI RESPONSE BY AI COMPOSER ACTION
 * USES GEMINI API
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Generate an AI response using the Gemini API.
 *
 * @param {object} payload
 * @param {string} payload.prompt       - The user prompt to send
 * @param {string} payload.model        - Gemini model ID (e.g. "gemini-3-flash-preview", "gemini-2.0-flash")
 * @param {number} payload.temperature  - Sampling temperature (0.0 - 1.0)
 * @param {string} payload.outputKey    - Key name to label the result in the returned object
 * @returns {Promise<{[outputKey]: string} | null>}
 */
export const generateAiResponse = async (payload) => {
  const { prompt, model, temperature, outputKey } = payload;
  console.log({
    prompt,
    model,
    temperature,
    outputKey,
  });
  const defaultModel = "gemini-1.5-flash";

  if (!prompt || !outputKey) {
    console.error("generateAiResponse: missing required fields", payload);
    return null;
  }

  const modelId = model || defaultModel;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        temperature: parseFloat(temperature) || 0.7,
      },
    });

    const text = response.text;
    return { [outputKey]: text };
  } catch (error) {
    console.error("Error generating AI response:", error.message);
    throw error;
  }
};
