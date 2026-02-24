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

  // Debug the expanded section's tables
  const debug = await page.evaluate(() => {
    const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row = rows[0];
    const expanded = row.nextElementSibling;
    if (!expanded || !expanded.classList.contains('space-y-2')) return { error: 'no expanded section' };

    const tables = expanded.querySelectorAll('table');
    return {
      tableCount: tables.length,
      tables: Array.from(tables).map(t => {
        const thead = t.querySelector('thead');
        const headerText = thead ? thead.textContent.trim() : 'no thead';
        const tbodyRows = t.querySelectorAll('tbody tr');
        return {
          headerText: headerText.substring(0, 100),
          hasVictoryOrDefeat: headerText.includes('Victory') || headerText.includes('Defeat'),
          rowCount: tbodyRows.length,
          firstRowChamp: tbodyRows[0]?.querySelector('a[href*="/champions/"] img')?.alt || 'none',
          firstRowSummoner: tbodyRows[0]?.querySelector('a[href*="/summoners/"]')?.textContent?.trim() || 'none',
        };
      })
    };
  });

  console.log(JSON.stringify(debug, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
