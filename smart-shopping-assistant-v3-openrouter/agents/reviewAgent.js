import { callOpenRouterWithCache } from '../api.js';

async function analyzeReviews(product, priceResult = null, safetyResult = null) {
  try {
    // Include price and safety information if available to enrich the context
    let contextInfo = '';
    
    if (priceResult && typeof priceResult === 'object') {
      contextInfo += `The product's price appears to be ${priceResult.dealRating || 'unknown'} compared to the market average of $${priceResult.averageMarketPrice || 'unknown'}. `;
    }
    
    if (safetyResult && typeof safetyResult === 'object') {
      contextInfo += `The website has a trust score of ${safetyResult.trustScore}/100. `;
    }
    
    const prompt = `${contextInfo}Summarize reviews for "${product}". Return results in the following JSON format:
    {
      "averageRating": number,
      "totalReviews": number or "Unknown",
      "pros": ["string", "string"],
      "cons": ["string", "string"],
      "suspiciousPatterns": ["string"] or [],
      "trustScore": number
    }`;
    
    // Use product name as cache key
    const cacheKey = `reviews:${product}`;
    const res = await callOpenRouterWithCache(prompt, cacheKey);
    
    // Ensure result is valid JSON
    try {
      const parsed = JSON.parse(res);
      // Validate minimum structure
      if (typeof parsed.averageRating !== 'number' ||
          !Array.isArray(parsed.pros) ||
          !Array.isArray(parsed.cons)) {
        throw new Error('Invalid response structure');
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse review analysis result:", e);
      return {
        averageRating: 0,
        totalReviews: "Unknown",
        pros: ["Information unavailable"],
        cons: ["Information unavailable"],
        suspiciousPatterns: [],
        trustScore: 0
      };
    }
  } catch (error) {
    console.error("Review analysis error:", error);
    return {
      averageRating: 0,
      totalReviews: "Error",
      pros: [],
      cons: [],
      suspiciousPatterns: ["Could not analyze reviews"],
      trustScore: 0
    };
  }
}

export { analyzeReviews };