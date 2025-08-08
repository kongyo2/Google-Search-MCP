import { performSearch } from './dist/search.js';

async function testSimple() {
  try {
    console.log('Testing simple search...');
    const results = await performSearch('javascript', { limit: 3 });
    console.log('Results found:', results.length);
    
    if (results.length > 0) {
      console.log('First result:');
      console.log('Title:', results[0].title);
      console.log('URL:', results[0].url);
      console.log('Description:', results[0].description);
    } else {
      console.log('No results found');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testSimple();