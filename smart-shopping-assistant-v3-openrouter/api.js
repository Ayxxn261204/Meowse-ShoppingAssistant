// Get API key and model from storage
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['openrouter_api_key', 'model'], (data) => {
      resolve({
        apiKey: data.openrouter_api_key || '',
        model: data.model || 'openai/gpt-3.5-turbo' // Default model
      });
    });
  });
}

async function callOpenRouter(prompt) {
  try {
    const settings = await getSettings();
    
    if (!settings.apiKey) {
      throw new Error('API key not set. Please configure in extension options.');
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${settings.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": chrome.runtime.getURL("/"), // Required by OpenRouter
        "X-Title": "Smart Shopping Assistant v3" // Identifying your application
      },
      body: JSON.stringify({
        model: settings.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    throw error;
  }
}

// Cache results to avoid redundant API calls
const apiCache = new Map();
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

async function callOpenRouterWithCache(prompt, cacheKey) {
  // Add model to cache key to prevent sharing results between models
  const settings = await getSettings();
  const fullCacheKey = `${settings.model}:${cacheKey}`;
  
  // Check cache first
  const cacheEntry = apiCache.get(fullCacheKey);
  if (cacheEntry && (Date.now() - cacheEntry.timestamp) < CACHE_EXPIRY) {
    return cacheEntry.data;
  }
  
  // Call API if not in cache or expired
  const result = await callOpenRouter(prompt);
  
  // Save to cache
  apiCache.set(fullCacheKey, {
    timestamp: Date.now(),
    data: result
  });
  
  return result;
}

// Function to clear the cache
function clearCache() {
  apiCache.clear();
  return { success: true };
}

export { callOpenRouter, callOpenRouterWithCache, clearCache };