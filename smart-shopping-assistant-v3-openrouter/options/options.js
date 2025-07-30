document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('api-key');
  const showKeyBtn = document.getElementById('show-key');
  const modelSelect = document.getElementById('model-select');
  const cacheToggle = document.getElementById('cache-toggle');
  const clearCacheBtn = document.getElementById('clear-cache');
  const saveBtn = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');
  
  // Load saved settings
  chrome.storage.sync.get(['openrouter_api_key', 'model', 'enable_cache'], (data) => {
    if (data.openrouter_api_key) {
      apiKeyInput.value = data.openrouter_api_key;
    }
    
    if (data.model) {
      modelSelect.value = data.model;
    }
    
    if (data.enable_cache !== undefined) {
      cacheToggle.checked = data.enable_cache;
    }
  });
  
  // Toggle API key visibility
  showKeyBtn.addEventListener('click', () => {
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      showKeyBtn.textContent = '🔒';
    } else {
      apiKeyInput.type = 'password';
      showKeyBtn.textContent = '👁️';
    }
  });
  
  // Clear cache button
  clearCacheBtn.addEventListener('click', () => {
    // Send message to background script to clear cache
    chrome.runtime.sendMessage({ type: 'clear-cache' }, (response) => {
      if (response && response.success) {
        showStatus('Cache cleared successfully!');
      } else {
        showStatus('Failed to clear cache.', true);
      }
    });
  });
  
  // Save settings
  saveBtn.addEventListener('click', () => {
    const apiKey = apiKeyInput.value.trim();
    const model = modelSelect.value;
    const enableCache = cacheToggle.checked;
    
    if (!apiKey) {
      showStatus('Please enter an API key.', true);
      return;
    }
    
    // Save to Chrome storage
    chrome.storage.sync.set({
      openrouter_api_key: apiKey,
      model: model,
      enable_cache: enableCache
    }, () => {
      if (chrome.runtime.lastError) {
        showStatus('Error saving settings: ' + chrome.runtime.lastError.message, true);
      } else {
        showStatus('Settings saved successfully!');
        
        // Notify background script that settings changed
        chrome.runtime.sendMessage({ 
          type: 'settings-updated',
          settings: { 
            enable_cache: enableCache,
            model: model
          }
        });
      }
    });
  });
  
  function showStatus(message, isError = false) {
    statusMessage.textContent = message;
    statusMessage.className = isError ? 'error' : '';
    
    // Clear status message after 3 seconds
    setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = '';
    }, 3000);
  }
});