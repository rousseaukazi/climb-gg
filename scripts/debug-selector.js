const puppeteer = require('/home/ubuntu/.openclaw/workspace/node_modules/puppeteer-core');

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

  // Count before
  const before = await page.evaluate(() => document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]').length);
  console.log('Game rows before expand:', before);

  // Expand first game
  await page.evaluate(() => {
    const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const btns = rows[0].querySelectorAll('button');
    for (const btn of btns) {
      const sr = btn.querySelector('.sr-only');
      if (sr && sr.textContent.includes('Show More Detail') && btn.offsetParent !== null) {
        btn.click(); return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  // Count after  
  const after = await page.evaluate(() => document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]').length);
  console.log('Game rows after expand:', after);

  // Check if row[0] is the same element
  const check = await page.evaluate(() => {
    const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row0 = rows[0];
    const champImg = row0.querySelector('a[href*="/champions/"] img');
    return {
      row0Champ: champImg?.alt || 'none',
      row0NextSibling: row0.nextElementSibling?.className?.substring(0, 30) || 'none',
      row0Parent: row0.parentElement?.className?.substring(0, 50) || 'none',
    };
  });
  console.log(JSON.stringify(check));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
