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

  await page.goto('https://www.op.gg/summoners/na/izakr-na2', { waitUntil: 'networkidle2', timeout: 60000 });
  await new Promise(r => setTimeout(r, 5000));

  // Find and click the expand button on the first game
  // The button with "Show More Detail Games" sr-only text
  const clicked = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    for (const btn of buttons) {
      const sr = btn.querySelector('.sr-only');
      if (sr && sr.textContent.includes('Show More Detail')) {
        btn.click();
        return true;
      }
    }
    // Try clicking the chevron/expand area
    const gameRows = document.querySelectorAll('div[class*="border-l-"][class*="game-item"]');
    if (gameRows.length) {
      gameRows[0].click();
      return 'clicked row';
    }
    return false;
  });
  console.log('Clicked:', clicked);
  await new Promise(r => setTimeout(r, 3000));

  // Now get the full parent container HTML to see expanded content
  const html = await page.evaluate(() => {
    const gameRows = document.querySelectorAll('div[class*="border-l-"][class*="game-item"]');
    if (!gameRows.length) return 'none';
    // Get the grandparent to see siblings (expanded detail)
    const gp = gameRows[0].parentElement.parentElement;
    return gp ? gp.innerHTML.substring(0, 30000) : gameRows[0].parentElement.innerHTML.substring(0, 30000);
  });

  fs.writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/dom-expanded.html', html);
  console.log('Saved expanded HTML, length:', html.length);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
