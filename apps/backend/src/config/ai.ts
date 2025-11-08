import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

/**
 * Initializes and exports a singleton Genkit AI instance
 * Handles all AI model configuration and initialization
 */
export const initializeAI = () => {
  const ai = genkit({
    plugins: [googleAI()],
    model: googleAI.model('gemini-2.5-flash-lite'),
  });

  return ai;
};

export const ai = initializeAI();
export { z };
