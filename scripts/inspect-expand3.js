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

  // Click expand on first game
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

  // Get the space-y-2 expanded div
  const html = await page.evaluate(() => {
    const el = document.querySelector('.space-y-2');
    return el ? el.innerHTML.substring(0, 50000) : 'not found';
  });

  fs.writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/dom-expanded-detail.html', html);
  console.log('Length:', html.length);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
