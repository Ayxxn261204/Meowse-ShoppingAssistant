import { checkWebsiteSafety, checkProductSafety } from './agents/safetyAgent.js';
import { comparePrices } from './agents/priceAgent.js';
import { analyzeReviews } from './agents/reviewAgent.js';
import { clearCache } from './api.js';

// Centralized analysis coordinator
async function analyzeProduct(productInfo) {
  try {
    // Step 1: Check website safety first
    const websiteSafety = await checkWebsiteSafety(productInfo.url);
    
    // If the website is unsafe, return early with the safety warning
    if (!websiteSafety.isSafe) {
      return { 
        error: '⚠️ Unsafe website detected', 
        safety: websiteSafety 
      };
    }
    
    // Step 2: Run all other analyses in parallel with shared context
    // Each agent receives results from previous agents
    const [pricing, productSafety] = await Promise.all([
      comparePrices(productInfo.title, productInfo.price, websiteSafety),
      checkProductSafety(productInfo.title, productInfo.url)
    ]);
    
    // Step 3: Review analysis can now use both safety and pricing data
    const reviews = await analyzeReviews(
      productInfo.title, 
      pricing, 
      websiteSafety
    );
    
    // Step 4: Return comprehensive analysis
    return {
      success: true,
      safety: websiteSafety,
      productSafety,
      pricing,
      reviews,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Analysis coordination error:", error);
    return {
      error: "Failed to complete analysis",
      errorMessage: error.message
    };
  }
}

// Listen for messages from the popup or content script
chrome.runtime.onMessage.addListener((req, sender, sendResponse) => {
  if (req.type === 'analyze-product') {
    (async () => {
      try {
        const result = await analyzeProduct(req);
        sendResponse(result);
      } catch (error) {
        console.error("Analysis error:", error);
        sendResponse({ 
          error: "Failed to complete analysis",
          errorMessage: error.message
        });
      }
    })();
    return true; // Keep the message channel open for async response
  }
  
  // Handle cache clearing
  if (req.type === 'clear-cache') {
    const result = clearCache();
    sendResponse(result);
    return false;
  }
  
  // Handle settings updates
  if (req.type === 'settings-updated') {
    console.log('Settings updated:', req.settings);
    sendResponse({ success: true });
    return false;
  }
});