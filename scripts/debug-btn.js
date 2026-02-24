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

  // Find all buttons in the first game row and describe them
  const info = await page.evaluate(() => {
    const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row = rows[0];
    const btns = row.querySelectorAll('button');
    return Array.from(btns).map((btn, i) => ({
      i,
      text: btn.textContent.trim().substring(0, 50),
      sr: btn.querySelector('.sr-only')?.textContent || '',
      parentCls: (btn.parentElement.className || '').substring(0, 80),
      visible: btn.offsetParent !== null,
      display: getComputedStyle(btn).display,
      btnCls: (btn.className || '').substring(0, 80),
    }));
  });

  console.log(JSON.stringify(info, null, 2));

  // Try clicking the visible expand button
  const clickResult = await page.evaluate(() => {
    const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row = rows[0];
    const btns = row.querySelectorAll('button');
    for (const btn of btns) {
      if (btn.offsetParent !== null) {
        const sr = btn.querySelector('.sr-only');
        if (sr) {
          btn.click();
          return { clicked: true, text: sr.textContent };
        }
      }
    }
    // Try clicking the last button in the row (often the expand)
    const lastBtn = btns[btns.length - 1];
    if (lastBtn) {
      lastBtn.click();
      return { clicked: true, text: 'last button', cls: lastBtn.className.substring(0, 50) };
    }
    return { clicked: false };
  });

  console.log('Click result:', JSON.stringify(clickResult));
  await new Promise(r => setTimeout(r, 3000));

  const spaceY2 = await page.evaluate(() => document.querySelectorAll('.space-y-2').length);
  console.log('space-y-2 count:', spaceY2);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
