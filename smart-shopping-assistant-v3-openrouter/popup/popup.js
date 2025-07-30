document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById("analyze-btn");
  const optionsBtn = document.getElementById("options-btn");
  const loadingEl = document.getElementById("loading");
  const errorContainer = document.getElementById("error-container");
  const errorMessage = errorContainer.querySelector(".error-message");
  const resultsContainer = document.getElementById("results-container");
  const initialState = document.getElementById("initial-state");
  const statusMessage = document.getElementById("status-message");
  
  const safetyResults = document.getElementById("safety-results");
  const productSafetyResults = document.getElementById("product-safety-results");
  const productSafetySection = document.querySelector(".product-safety-section");
  const priceResults = document.getElementById("price-results");
  const reviewResults = document.getElementById("review-results");
  
  // Check if API key is set
  chrome.storage.sync.get('openai_api_key', (data) => {
    if (!data.openai_api_key) {
      statusMessage.textContent = "⚠️ API key not set. Please configure in options.";
      statusMessage.classList.remove("hidden");
    }
  });
  
  // Open options page when the options button is clicked
  optionsBtn.addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });
  
  analyzeBtn.addEventListener("click", async () => {
    // Show loading state
    initialState.classList.add("hidden");
    errorContainer.classList.add("hidden");
    resultsContainer.classList.add("hidden");
    loadingEl.classList.remove("hidden");
    statusMessage.classList.add("hidden");
    
    try {
      // Get current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Request product info from content script
      chrome.tabs.sendMessage(tab.id, { type: "get-product-info" }, (productInfo) => {
        if (chrome.runtime.lastError) {
          showError("Could not communicate with page: " + chrome.runtime.lastError.message);
          return;
        }
        
        if (!productInfo) {
          showError("Could not extract product information from this page.");
          return;
        }
        
        if (productInfo.title === 'Unknown Product' && productInfo.price === 0) {
          showError("This doesn't appear to be a product page.");
          return;
        }
        
        // Send product info to background script for analysis
        chrome.runtime.sendMessage({ 
          type: "analyze-product", 
          ...productInfo 
        }, (res) => {
          loadingEl.classList.add("hidden");
          
          if (chrome.runtime.lastError) {
            showError("Analysis error: " + chrome.runtime.lastError.message);
            return;
          }
          
          if (res.error) {
            showError(res.error);
            
            // If we have safety info despite the error, show it
            if (res.safety) {
              renderSafetyInfo(res.safety);
              resultsContainer.classList.remove("hidden");
            }
            return;
          }
          
          // Render all results
          renderSafetyInfo(res.safety);
          
          // Show product safety info if available
          if (res.productSafety) {
            renderProductSafetyInfo(res.productSafety);
            productSafetySection.classList.remove("hidden");
          } else {
            productSafetySection.classList.add("hidden");
          }
          
          renderPriceInfo(res.pricing);
          renderReviewInfo(res.reviews);
          
          resultsContainer.classList.remove("hidden");
        });
      });
    } catch (error) {
      showError("An error occurred: " + error.message);
    }
  });
  
  function showError(message) {
    loadingEl.classList.add("hidden");
    errorMessage.textContent = message;
    errorContainer.classList.remove("hidden");
  }
  
  function renderSafetyInfo(safety) {
    const safetyClass = safety.isSafe ? "safe" : "unsafe";
    const safetyIcon = safety.isSafe ? "✅" : "⚠️";
    
    safetyResults.innerHTML = `
      <div class="safety-indicator ${safetyClass}">
        <span class="safety-icon">${safetyIcon}</span>
        <span class="safety-status">${safety.isSafe ? 'Safe' : 'Warning'}</span>
      </div>
      <div class="safety-details">
        <div class="trust-score">Trust Score: <span>${safety.trustScore || 'N/A'}/100</span></div>
        ${safety.threats && safety.threats.length ? 
          `<div class="threats">
            <strong>Potential Issues:</strong>
            <ul>${safety.threats.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>` : ''
        }
        ${safety.recommendation ? 
          `<div class="recommendation"><strong>Recommendation:</strong> ${safety.recommendation}</div>` : ''
        }
      </div>
    `;
  }
  
  function renderProductSafetyInfo(productSafety) {
    const safetyClass = productSafety.isProductSafe ? "safe" : "unsafe";
    const safetyIcon = productSafety.isProductSafe ? "✅" : "⚠️";
    
    productSafetyResults.innerHTML = `
      <div class="safety-indicator ${safetyClass}">
        <span class="safety-icon">${safetyIcon}</span>
        <span class="safety-status">${productSafety.isProductSafe ? 'No Issues Found' : 'Warning'}</span>
      </div>
      <div class="safety-details">
        ${productSafety.knownIssues && productSafety.knownIssues.length ? 
          `<div class="threats">
            <strong>Known Issues:</strong>
            <ul>${productSafety.knownIssues.map(t => `<li>${t}</li>`).join('')}</ul>
          </div>` : '<p>No known issues with this product.</p>'
        }
        ${productSafety.recommendation ? 
          `<div class="recommendation"><strong>Recommendation:</strong> ${productSafety.recommendation}</div>` : ''
        }
      </div>
    `;
  }
  
  function renderPriceInfo(pricing) {
    let dealBadge = '';
    if (pricing.dealRating) {
      const dealClass = 
        pricing.dealRating === 'Good Deal' ? 'good-deal' :
        pricing.dealRating === 'Overpriced' ? 'bad-deal' : 'average-deal';
      
      dealBadge = `<span class="deal-badge ${dealClass}">${pricing.dealRating}</span>`;
    }
    
    priceResults.innerHTML = `
      <div class="price-header">
        ${dealBadge}
        ${pricing.averageMarketPrice ? 
          `<div class="market-price">Average Market Price: <span>$${pricing.averageMarketPrice.toFixed(2)}</span></div>` : ''
        }
      </div>
      
      ${pricing.betterDeals && pricing.betterDeals.length ? 
        `<div class="better-deals">
          <strong>Better Deals Found:</strong>
          <ul>
            ${pricing.betterDeals.map(deal => `
              <li>
                <div class="deal-store">${deal.store}</div>
                <div class="deal-price">$${deal.price.toFixed(2)}</div>
                ${deal.savings ? `<div class="deal-savings">Save $${deal.savings.toFixed(2)}</div>` : ''}
                ${deal.url ? `<a href="${deal.url}" target="_blank" class="deal-link">View Deal</a>` : ''}
              </li>
            `).join('')}
          </ul>
        </div>` : 
        '<p>No better deals found at this time.</p>'
      }
    `;
  }
  
  function renderReviewInfo(reviews) {
    const ratingStars = reviews.averageRating ? 
      generateStars(reviews.averageRating) : 
      '<span class="no-rating">No ratings available</span>';
      reviewResults.innerHTML = `
      <div class="rating-container">
        <div class="stars">${ratingStars}</div>
        <div class="rating-number">${reviews.averageRating ? reviews.averageRating.toFixed(1) : 'N/A'}/5</div>
        ${reviews.totalReviews ? `<div class="total-reviews">(${reviews.totalReviews} reviews)</div>` : ''}
      </div>
      
      <div class="review-details">
        ${reviews.pros && reviews.pros.length ? 
          `<div class="pros">
            <strong>Pros:</strong>
            <ul>${reviews.pros.map(pro => `<li>${pro}</li>`).join('')}</ul>
          </div>` : ''
        }
        
        ${reviews.cons && reviews.cons.length ? 
          `<div class="cons">
            <strong>Cons:</strong>
            <ul>${reviews.cons.map(con => `<li>${con}</li>`).join('')}</ul>
          </div>` : ''
        }
        
        ${reviews.suspiciousPatterns && reviews.suspiciousPatterns.length ? 
          `<div class="suspicious-patterns">
            <strong>Review Concerns:</strong>
            <ul>${reviews.suspiciousPatterns.map(pattern => `<li>${pattern}</li>`).join('')}</ul>
          </div>` : ''
        }
        
        ${reviews.trustScore ? 
          `<div class="review-trust-score">Review Trust Score: <span>${reviews.trustScore}/100</span></div>` : ''
        }
      </div>
    `;
  }
  
  function generateStars(rating) {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return '★'.repeat(fullStars) + 
           (halfStar ? '½' : '') + 
           '☆'.repeat(emptyStars);
  }
});