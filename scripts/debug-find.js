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

  // Click expand on first game (visible button)
  await page.evaluate(() => {
    const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row = rows[0];
    const btns = row.querySelectorAll('button');
    for (const btn of btns) {
      const sr = btn.querySelector('.sr-only');
      if (sr && sr.textContent.includes('Show More Detail') && btn.offsetParent !== null) {
        btn.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  // Now debug: what is the nextElementSibling of row[0]?
  const debug = await page.evaluate(() => {
    const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row = rows[0];
    const next = row.nextElementSibling;
    
    // Also check: is .space-y-2 a sibling?
    const parent = row.parentElement;
    const children = Array.from(parent.children);
    const rowIdx = children.indexOf(row);
    
    return {
      nextTag: next ? next.tagName : null,
      nextCls: next ? next.className.substring(0, 80) : null,
      nextIsSpaceY2: next ? next.classList.contains('space-y-2') : false,
      rowIdx,
      totalChildren: children.length,
      childAfterRow: children[rowIdx + 1] ? {
        tag: children[rowIdx + 1].tagName,
        cls: children[rowIdx + 1].className.substring(0, 80),
        isSpaceY2: children[rowIdx + 1].classList.contains('space-y-2'),
      } : null,
      spaceY2Count: document.querySelectorAll('.space-y-2').length,
      // Check if space-y-2 is inside the game row
      spaceY2InRow: row.querySelector('.space-y-2') !== null,
    };
  });

  console.log(JSON.stringify(debug, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
