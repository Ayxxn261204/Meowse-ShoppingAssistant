# Meowse v3

A Chrome extension that helps users make informed purchasing decisions by analyzing prices, reviews, and website safety.

## Features

- **Website Safety Check**: Verifies if the current shopping website is secure and trustworthy
- **Product Authenticity**: Checks for known issues with the product
- **Price Comparison**: Compares the current price with market averages and finds better deals
- **Review Analysis**: Summarizes product reviews, highlighting pros and cons
- **Review Trust Analysis**: Detects suspicious patterns in reviews

## Installation

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension folder
5. Click the extension icon in your browser toolbar

## Configuration

1. Click the "Options" button in the extension popup
2. Enter your OpenAI API key
3. Configure caching settings as desired
4. Click "Save Settings"

## Usage

1. Navigate to a product page on any e-commerce website
2. Click the extension icon in your toolbar
3. Click "Analyze This Product"
4. View the comprehensive analysis of the product

## How It Works

The extension uses AI to analyze various aspects of online products:

1. The content script extracts product information from the current page
2. The safety agent checks if the website is legitimate and secure
3. The price agent compares prices across the web
4. The review agent analyzes and summarizes product reviews
5. All results are displayed in the extension popup

## Development

- Built with vanilla JavaScript
- Uses the OpenAI API for AI-powered analysis
- Chrome Extension Manifest V3 compatible

## License

MIT License