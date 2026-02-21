const puppeteer = require('/home/ubuntu/.openclaw/workspace/node_modules/puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

  // Intercept API responses
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') && (url.includes('games') || url.includes('summoner') || url.includes('renewal'))) {
      try {
        const text = await response.text();
        apiResponses.push({ url, body: text });
      } catch(e) {}
    }
  });

  console.log('Navigating...');
  await page.goto('https://www.op.gg/summoners/na/izakr-na2', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  console.log('API responses captured:', apiResponses.length);
  for (const r of apiResponses) {
    console.log('URL:', r.url.substring(0, 150));
    console.log('Body preview:', r.body.substring(0, 200));
    console.log('---');
  }

  // Save all API responses
  require('fs').writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/api-responses.json', 
    JSON.stringify(apiResponses, null, 2));

  // Now try a more careful DOM extraction with better selectors
  const data = await page.evaluate(() => {
    // Profile extraction - look at the actual rendered content more carefully
    const profile = {};
    
    // Get all text content organized by sections
    const body = document.body.innerHTML;
    
    // Find rank from tier section
    const tierMatch = body.match(/(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)\s*(I|II|III|IV|[1-4])?/i);
    if (tierMatch) profile.tier = tierMatch[0];
    
    const lpMatch = body.match(/(\d+)\s*LP/);
    if (lpMatch) profile.lp = lpMatch[1];

    // Get the summoner name from title
    const title = document.title;
    const nameMatch = title.match(/^(.+?)\s*-/);
    if (nameMatch) profile.name = nameMatch[1].trim();

    // Try to extract from React state/props
    const scripts = document.querySelectorAll('script');
    let jsonData = null;
    scripts.forEach(s => {
      const text = s.textContent;
      if (text.includes('"summoner_id"') || text.includes('"games"')) {
        try {
          // Find JSON objects in script tags
          const matches = text.match(/\{[^{}]*"summoner_id"[^{}]*\}/g);
          if (matches) jsonData = matches;
        } catch(e) {}
      }
    });

    // Extract game data using a more specific approach
    // Look for the game list items by their visual structure
    const games = [];
    
    // Find all elements with time tags (each game has a time element)
    const timeElements = document.querySelectorAll('time');
    
    timeElements.forEach(timeEl => {
      // Walk up to find the game container
      let container = timeEl.closest('[class*="css-"]');
      // Walk up a few levels to get the full game row
      for (let i = 0; i < 5 && container; i++) {
        const parent = container.parentElement;
        if (parent && parent.querySelectorAll('img').length > 5) {
          container = parent;
          break;
        }
        container = parent;
      }
      
      if (!container) return;
      
      const text = container.textContent;
      const imgs = container.querySelectorAll('img');
      
      // Skip if this doesn't look like a game
      if (imgs.length < 3) return;
      
      const game = {
        timeAgo: timeEl.textContent.trim(),
        dateTime: timeEl.getAttribute('datetime') || timeEl.title || '',
        rawText: text.substring(0, 500)
      };
      
      games.push(game);
    });

    return { profile, games, timeElementCount: timeElements.length };
  });

  console.log('\nProfile:', JSON.stringify(data.profile));
  console.log('Time elements found:', data.timeElementCount);
  console.log('Games extracted:', data.games.length);
  if (data.games.length > 0) {
    console.log('First game raw:', data.games[0].rawText.substring(0, 300));
  }

  await browser.close();
  console.log('Done');
})().catch(e => { console.error(e); process.exit(1); });
