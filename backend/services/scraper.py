import requests
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
import re

ua = UserAgent()

def extract_price(text):
    """Extracts the first valid price from a text string."""
    if not text:
        return None
    # Match patterns like 499, 1,499, 499.99
    # Strip non-numeric except dot and comma
    clean = re.sub(r'[^\d.,]', '', text)
    if not clean:
        return None
    try:
        # Handle commas: 1,499.99 -> 1499.99
        clean = clean.replace(',', '')
        return float(clean)
    except ValueError:
        return None

from functools import lru_cache

@lru_cache(maxsize=128)
def scrape_price(url, platform):
    """
    Attempts to scrape the price from the given URL.
    Returns the price as a float, or None if scraping fails.
    """
    if not url:
        return None
        
    headers = {
        'User-Agent': ua.random,
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    }
    
    try:
        # Short timeout so it doesn't hang the app
        response = requests.get(url, headers=headers, timeout=1.5)
        
        # Amazon often returns 503 for bots.
        if response.status_code != 200:
            print(f"[Scraper] Failed to fetch {url} - Status: {response.status_code}")
            return None
            
        soup = BeautifulSoup(response.content, 'html.parser')
        platform = platform.lower()
        
        if 'amazon' in platform:
            # Try common Amazon price selectors
            price_elem = soup.select_one('span.a-price-whole')
            if price_elem:
                return extract_price(price_elem.text)
            
            # Fallback for Amazon
            price_elem = soup.select_one('span#priceblock_ourprice')
            if price_elem:
                return extract_price(price_elem.text)
                
            price_elem = soup.select_one('span.a-offscreen')
            if price_elem:
                return extract_price(price_elem.text)
                
        elif 'flipkart' in platform:
            # Common Flipkart price selector
            # (Note: Flipkart classes change often, these are common guesses)
            price_elem = soup.select_one('div._30jeq3._16Jk6d')
            if not price_elem:
                price_elem = soup.select_one('div.Nx9bqj.CxhGGd')
            if price_elem:
                return extract_price(price_elem.text)
                
        elif 'nykaa' in platform:
            price_elem = soup.select_one('span.css-1jczs19')
            if price_elem:
                return extract_price(price_elem.text)
                
        # Generic fallback
        print(f"[Scraper] Could not find known price elements on {url} for platform {platform}")
        return None
        
    except requests.exceptions.Timeout:
        print(f"[Scraper] Timeout fetching {url}")
        return None
    except Exception as e:
        print(f"[Scraper] Error scraping {url}: {e}")
        return None
