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

  // Debug: Find expand buttons and their relationship to game rows
  const debug = await page.evaluate(() => {
    const gameRows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row0 = gameRows[0];
    
    // Walk up the DOM from row0 and show structure
    const ancestry = [];
    let el = row0;
    for (let depth = 0; depth < 5 && el; depth++) {
      ancestry.push({
        tag: el.tagName,
        cls: (el.className || '').substring(0, 80),
        childCount: el.children ? el.children.length : 0,
        siblingCount: el.parentElement ? el.parentElement.children.length : 0,
      });
      el = el.parentElement;
    }

    // Find all buttons with "Show More Detail" text
    const expandBtns = [];
    const btns = document.querySelectorAll('button');
    btns.forEach((btn, i) => {
      const sr = btn.querySelector('.sr-only');
      if (sr && sr.textContent.includes('Show More Detail')) {
        // What game row is this near?
        const gameRow = btn.closest('div[class*="border-l-"][class*="game-item-color"]');
        expandBtns.push({
          index: i,
          inGameRow: !!gameRow,
          parentTag: btn.parentElement.tagName,
          parentCls: (btn.parentElement.className || '').substring(0, 50),
        });
      }
    });

    return { ancestry, expandBtns: expandBtns.slice(0, 5), totalExpandBtns: expandBtns.length };
  });

  console.log(JSON.stringify(debug, null, 2));

  // Now click the first expand button and check what appears
  const beforeSpaceY2 = await page.evaluate(() => document.querySelectorAll('.space-y-2').length);
  console.log('space-y-2 before click:', beforeSpaceY2);

  await page.evaluate(() => {
    const btns = document.querySelectorAll('button');
    for (const btn of btns) {
      const sr = btn.querySelector('.sr-only');
      if (sr && sr.textContent.includes('Show More Detail')) {
        btn.click();
        return true;
      }
    }
  });
  await new Promise(r => setTimeout(r, 3000));

  const afterSpaceY2 = await page.evaluate(() => document.querySelectorAll('.space-y-2').length);
  console.log('space-y-2 after click:', afterSpaceY2);

  // Check what's the structure around the first game row after expanding
  const structure = await page.evaluate(() => {
    const gameRows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
    const row0 = gameRows[0];
    // Get all siblings of row0's parent
    const parent = row0.parentElement;
    const siblings = Array.from(parent.children).map((s, i) => ({
      i, tag: s.tagName, cls: (s.className || '').substring(0, 60), 
      hasTable: !!s.querySelector('table'),
      children: s.children.length
    }));
    
    // Also check: is the game row itself a direct child, or nested?
    const gpChildren = Array.from(parent.parentElement.children).map((s, i) => ({
      i, tag: s.tagName, cls: (s.className || '').substring(0, 80),
      hasSpaceY2: s.classList.contains('space-y-2'),
      hasTable: !!s.querySelector('table[class*="min-w"]'),
    }));

    return { parentSiblings: siblings, grandparentChildren: gpChildren.slice(0, 6) };
  });

  console.log(JSON.stringify(structure, null, 2));

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
