const puppeteer = require('/home/ubuntu/.openclaw/workspace/node_modules/puppeteer-core');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: '/snap/bin/chromium',
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

  console.log('Navigating...');
  await page.goto('https://www.op.gg/summoners/na/izakr-na2', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  // Click the first game to expand it
  const gameRows = await page.$$('div[class*="border-l-"][class*="game-item"]');
  console.log('Game rows found:', gameRows.length);
  
  if (gameRows.length > 0) {
    await gameRows[0].click();
    await new Promise(r => setTimeout(r, 3000));
    
    // Now dump the HTML of the expanded area
    const html = await page.evaluate(() => {
      // Find the expanded detail section - look for participant tables/lists
      const gameRows = document.querySelectorAll('div[class*="border-l-"][class*="game-item"]');
      if (!gameRows.length) return 'No game rows';
      
      const firstGame = gameRows[0];
      // The expanded content is likely a sibling or child
      const parent = firstGame.parentElement;
      return parent.innerHTML.substring(0, 15000);
    });
    
    fs.writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/dom-inspect.html', html);
    console.log('Saved DOM HTML');
    
    // Also try to find the detail/expand section more specifically
    const detailHTML = await page.evaluate(() => {
      // Look for elements that appeared after click - typically a detail pane
      const details = document.querySelectorAll('[class*="detail"], [class*="Detail"], [class*="expand"], [class*="Expand"], [class*="participant"], [class*="Participant"]');
      const results = [];
      details.forEach(el => {
        results.push({ class: el.className, tag: el.tagName, htmlSnippet: el.innerHTML.substring(0, 2000) });
      });
      return results;
    });
    
    fs.writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/dom-details.json', JSON.stringify(detailHTML, null, 2));
    console.log('Detail sections found:', detailHTML.length);
  }

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
