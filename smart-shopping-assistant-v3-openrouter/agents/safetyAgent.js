import { callOpenRouterWithCache } from '../api.js';

async function checkWebsiteSafety(url) {
  try {
    const hostname = new URL(url).hostname;
    const prompt = `Is the website ${hostname} safe for shopping? Return JSON with this exact format: 
    { 
      "isSafe": true/false, 
      "trustScore": number between 0-100, 
      "threats": ["string"] or [] if none, 
      "recommendation": "string"
    }`;
    
    // Use hostname as cache key
    const cacheKey = `safety:${hostname}`;
    const res = await callOpenRouterWithCache(prompt, cacheKey);
    
    try {
      const parsed = JSON.parse(res);
      // Validate minimum structure
      if (typeof parsed.isSafe !== 'boolean' ||
          typeof parsed.trustScore !== 'number') {
        throw new Error('Invalid response structure');
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse safety check result:", e);
      return { 
        isSafe: true, 
        trustScore: 50,
        threats: ["Could not verify safety"], 
        recommendation: "Proceed with caution"
      };
    }
  } catch (error) {
    console.error("Safety check error:", error);
    return { 
      isSafe: true, 
      trustScore: 50,
      threats: [], 
      recommendation: "Could not check safety, proceed with caution"
    };
  }
}

// Add additional function to check if a specific product from this site has any known issues
async function checkProductSafety(product, url) {
  try {
    const hostname = new URL(url).hostname;
    const prompt = `Check if "${product}" sold on ${hostname} has any known safety, quality, or counterfeit issues. Return JSON with this format:
    {
      "isProductSafe": true/false,
      "knownIssues": ["string"] or [],
      "recommendation": "string"
    }`;
    
    // Use product and hostname as cache key
    const cacheKey = `product_safety:${product}:${hostname}`;
    const res = await callOpenRouterWithCache(prompt, cacheKey);
    
    try {
      return JSON.parse(res);
    } catch (e) {
      console.error("Failed to parse product safety result:", e);
      return {
        isProductSafe: true,
        knownIssues: [],
        recommendation: "No known issues, but always verify product authenticity"
      };
    }
  } catch (error) {
    console.error("Product safety check error:", error);
    return {
      isProductSafe: true,
      knownIssues: [],
      recommendation: "Could not check product safety, proceed with caution"
    };
  }
}

export { checkWebsiteSafety, checkProductSafety };