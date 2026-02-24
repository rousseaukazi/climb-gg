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

  // Click the expand chevron button on the first game
  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const sr = btn.querySelector('.sr-only');
      if (sr && sr.textContent.includes('Show More Detail')) {
        btn.click();
        return;
      }
    }
  });
  await new Promise(r => setTimeout(r, 4000));

  // Take a screenshot to see what expanded
  await page.screenshot({ path: '/home/ubuntu/.openclaw/workspace/climb-gg/data/expanded-screenshot.png', fullPage: false });

  // Get all HTML that's new / the full page structure around game 1
  const html = await page.evaluate(() => {
    // Look for any new tables or sections that appeared
    const all = document.querySelectorAll('table, [class*="overview"], [class*="Overview"], [class*="build"], [class*="Build"]');
    const results = [];
    all.forEach(el => results.push({ tag: el.tagName, cls: el.className.substring(0, 200), html: el.innerHTML.substring(0, 3000) }));
    
    // Also check body for new content - look for anything after the game row
    const gameItems = document.querySelectorAll('[class*="game-item"]');
    // Check for any sibling that might be the expanded content
    const firstParent = gameItems[0]?.parentElement;
    const siblings = firstParent ? Array.from(firstParent.children) : [];
    
    return {
      tables: results.length,
      tableData: results.slice(0, 3),
      siblingCount: siblings.length,
      siblingsInfo: siblings.map(s => ({ tag: s.tagName, cls: (s.className || '').substring(0, 100), childCount: s.children.length }))
    };
  });

  console.log(JSON.stringify(html, null, 2));
  
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
