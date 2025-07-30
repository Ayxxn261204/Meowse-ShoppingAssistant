/**
 * Improved product information extraction with more robust selectors
 * and structured data parsing
 */
function extractProductInfo() {
  try {
    // First, try to extract from structured data if available
    const structuredData = extractFromStructuredData();
    if (structuredData.title && structuredData.price > 0) {
      return structuredData;
    }
    
    // Fall back to DOM selectors if structured data is not available
    return extractFromDOM();
  } catch (error) {
    console.error("Error in product info extraction:", error);
    return {
      title: 'Unknown Product',
      price: 0,
      url: window.location.href,
      error: 'Failed to extract product information'
    };
  }
}

function extractFromStructuredData() {
  try {
    // Look for JSON-LD structured data
    const jsonldElements = document.querySelectorAll('script[type="application/ld+json"]');
    for (const element of jsonldElements) {
      try {
        const data = JSON.parse(element.textContent);
        
        // Handle both direct product and graph with product
        const products = [];
        
        // If it's a graph
        if (data['@graph']) {
          products.push(...data['@graph'].filter(item => 
            item['@type'] === 'Product' || 
            (Array.isArray(item['@type']) && item['@type'].includes('Product'))
          ));
        }
        
        // Direct product
        if (data['@type'] === 'Product' || 
           (Array.isArray(data['@type']) && data['@type'].includes('Product'))) {
          products.push(data);
        }
        
        for (const product of products) {
          let title = product.name;
          let price = null;
          
          // Extract price
          if (product.offers) {
            const offers = Array.isArray(product.offers) ? product.offers : [product.offers];
            for (const offer of offers) {
              if (offer.price) {
                price = parseFloat(offer.price);
                break;
              }
            }
          }
          
          if (title && price && !isNaN(price)) {
            return {
              title: title,
              price: price,
              url: window.location.href,
              imageUrl: product.image || null,
              description: product.description || null
            };
          }
        }
      } catch (e) {
        console.warn("Error parsing JSON-LD:", e);
      }
    }
    
    // Look for microdata
    const itemProps = document.querySelectorAll('[itemtype="http://schema.org/Product"]');
    for (const item of itemProps) {
      const titleEl = item.querySelector('[itemprop="name"]');
      const priceEl = item.querySelector('[itemprop="price"], [itemprop="offers"] [itemprop="price"]');
      
      if (titleEl && priceEl) {
        const title = titleEl.textContent.trim();
        const price = parseFloat(priceEl.textContent.replace(/[^0-9.]/g, ''));
        
        if (title && price && !isNaN(price)) {
          return {
            title: title,
            price: price,
            url: window.location.href
          };
        }
      }
    }
    
    return { title: null, price: 0, url: window.location.href };
  } catch (error) {
    console.warn("Error extracting structured data:", error);
    return { title: null, price: 0, url: window.location.href };
  }
}

function extractFromDOM() {
  // Expanded selectors for product title
  const titleSelectors = [
    'h1', // Basic heading
    '[data-testid="product-title"]', // Common test ID
    '[class*="product-title"]', // Class name pattern matching
    '[class*="productTitle"]',
    '[class*="product_title"]',
    '.product-name h1',
    '.product-title',
    '[itemprop="name"]',
    // More specific selectors for common e-commerce sites
    '.product-detail-name',
    '#productTitle',
    '.product_title',
    '.product-single__title',
    '.pdp-header h1',
    '.product-info-main .page-title'
  ];
  
  // Expanded selectors for product price
  const priceSelectors = [
    '[itemprop="price"]',
    '[data-testid="product-price"]',
    '[class*="product-price"]',
    '[class*="productPrice"]',
    '[class*="price"]',
    '.price',
    '.product-price',
    '.offer-price',
    // More specific selectors for common sites
    '#priceblock_ourprice',
    '#priceblock_dealprice',
    '.a-price .a-offscreen',
    '.product-price-current',
    '.current-price',
    '.price-box .price',
    '.product-info-price .price',
    '.product__price',
    '.product-single__price'
  ];
  
  // Find title with expanded selectors
  let title = null;
  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element && element.innerText.trim()) {
      title = element.innerText.trim();
      break;
    }
  }
  
  // Find price with expanded selectors and data attribute checking
  let price = null;
  for (const selector of priceSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      // Check multiple data attributes that might contain price
      const priceAttrs = ['content', 'value', 'data-price', 'data-product-price'];
      
      for (const attr of priceAttrs) {
        if (element.hasAttribute(attr)) {
          const priceStr = element.getAttribute(attr);
          const possiblePrice = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
          if (!isNaN(possiblePrice) && possiblePrice > 0) {
            price = possiblePrice;
            break;
          }
        }
      }
      
      // If no price found in attributes, try innerText
      if (!price && element.innerText) {
        const priceStr = element.innerText;
        price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(price) && price > 0) break;
      }
    }
  }
  
  return {
    title: title || 'Unknown Product',
    price: price || 0,
    url: window.location.href
  };
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'get-product-info') {
    try {
      const productInfo = extractProductInfo();
      sendResponse(productInfo);
    } catch (error) {
      console.error("Error extracting product info:", error);
      sendResponse({
        title: 'Unknown Product',
        price: 0,
        url: window.location.href,
        error: 'Failed to extract product information'
      });
    }
  }
});