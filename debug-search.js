import axios from 'axios';
import * as cheerio from 'cheerio';
import randomUseragent from 'random-useragent';
import { writeFileSync } from 'fs';

async function debugSearch() {
  let userAgent = randomUseragent.getRandom();
  
  // If we got a mobile user agent, try a few more times to get a desktop one
  for (let i = 0; i < 5; i++) {
    if (userAgent && (userAgent.includes('Windows') || userAgent.includes('Macintosh') || userAgent.includes('Linux'))) {
      break;
    }
    userAgent = randomUseragent.getRandom();
  }
  
  console.log('Using User Agent:', userAgent);
  
  const headers = {
    'User-Agent': userAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
  };

  try {
    const response = await axios.get('https://www.google.com/search', {
      params: { q: 'javascript' },
      headers,
      timeout: 10000
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const $ = cheerio.load(response.data);
    
    // Check what we actually got
    console.log('Title:', $('title').text());
    console.log('Body length:', response.data.length);
    
    // Look for common Google elements
    console.log('div.g count:', $('div.g').length);
    console.log('.tF2Cxc count:', $('.tF2Cxc').length);
    console.log('h3 count:', $('h3').length);
    console.log('a count:', $('a').length);
    
    // Save HTML for inspection
    writeFileSync('debug-response.html', response.data);
    console.log('HTML saved to debug-response.html');
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
    }
  }
}

debugSearch();