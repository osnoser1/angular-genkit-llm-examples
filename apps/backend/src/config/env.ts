/**
 * Environment variable validation and exports
 * Ensures all required environment variables are available at startup
 */

const getEnvVariable = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not defined`);
  }

  return value || defaultValue || '';
};

export const config = {
  port: parseInt(getEnvVariable('PORT', '3000'), 10),
  nodeEnv: getEnvVariable('NODE_ENV', 'development'),
  apiKey: getEnvVariable('GEMINI_API_KEY', ''),
};
