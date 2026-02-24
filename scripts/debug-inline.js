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

  // Click expand
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

  // Now do the EXACT same thing the scraper does
  const result = await page.evaluate(() => {
    const gameRows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row = gameRows[0];
    if (!row) return { error: 'no row' };

    let container = row;
    let expandedSection = null;
    const next = container.nextElementSibling;
    
    const info = {
      nextExists: !!next,
      nextCls: next ? next.className.substring(0, 50) : null,
      nextIsSpaceY2: next ? next.classList.contains('space-y-2') : false,
    };

    if (next && next.classList.contains('space-y-2')) {
      expandedSection = next;
    }
    if (!expandedSection) {
      const all = document.querySelectorAll('.space-y-2');
      info.fallbackCount = all.length;
      if (all.length) expandedSection = all[all.length - 1];
    }

    info.expandedFound = !!expandedSection;
    if (expandedSection) {
      const tables = expandedSection.querySelectorAll('table');
      info.tableCount = tables.length;
      for (const table of tables) {
        const thead = table.querySelector('thead');
        info.theadText = thead ? thead.textContent.substring(0, 80) : 'no thead';
        const trs = table.querySelectorAll('tbody tr:not(.ad)');
        info.rowCount = trs.length;
        if (trs.length > 0) {
          const tr = trs[0];
          info.firstTrChampImg = tr.querySelector('a[href*="/champions/"] img')?.alt || 'none';
          info.firstTrSummoner = tr.querySelector('a[href*="/summoners/"]')?.textContent?.trim() || 'none';
          info.firstTrTdCount = tr.querySelectorAll('td').length;
        }
        break; // just check first table
      }
    }

    return info;
  });

  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
