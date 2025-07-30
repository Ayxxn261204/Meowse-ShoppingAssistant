import { callOpenRouterWithCache } from '../api.js';

async function comparePrices(product, price, safetyResult = null) {
  try {
    // Include safety information if available to enrich the context
    let safetyContext = '';
    if (safetyResult && typeof safetyResult === 'object') {
      safetyContext = `This product is being sold on a site with safety score: ${safetyResult.trustScore}/100. `;
      if (safetyResult.threats && safetyResult.threats.length) {
        safetyContext += `Note these concerns about the site: ${safetyResult.threats.join(', ')}. `;
      }
    }
    
    const prompt = `${safetyContext}Compare online prices for "${product}" priced at ${price} USD. Return any better deals and their URLs as JSON with this format: 
    {
      "averageMarketPrice": number,
      "dealRating": "Good Deal" | "Average" | "Overpriced",
      "betterDeals": [
        {
          "store": "string",
          "price": number,
          "url": "string",
          "savings": number
        }
      ]
    }`;
    
    // Use product name and price as cache key
    const cacheKey = `price:${product}:${price}`;
    const res = await callOpenRouterWithCache(prompt, cacheKey);
    
    // Ensure result is valid JSON
    try {
      const parsed = JSON.parse(res);
      // Validate the structure
      if (typeof parsed.averageMarketPrice !== 'number' || 
          !Array.isArray(parsed.betterDeals)) {
        throw new Error('Invalid response structure');
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse price comparison result:", e);
      return {
        averageMarketPrice: price, 
        dealRating: "Unknown",
        betterDeals: []
      };
    }
  } catch (error) {
    console.error("Price comparison error:", error);
    return {
      averageMarketPrice: price, 
      dealRating: "Error",
      betterDeals: []
    };
  }
}

export { comparePrices };