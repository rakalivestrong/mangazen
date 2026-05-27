const axios = require('axios');

async function testComick() {
  try {
    const res = await axios.get('https://api.comick.io/v1.0/search?q=solo+leveling&limit=5', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Origin': 'https://comick.io',
        'Referer': 'https://comick.io/'
      }
    });
    console.log("Success! Found:", res.data.length);
    console.log(res.data[0].title);
  } catch (err) {
    console.error("Error:", err.response ? err.response.status : err.message);
  }
}

testComick();
