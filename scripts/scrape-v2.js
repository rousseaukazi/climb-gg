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

  const gameCount = await page.evaluate(() =>
    document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]').length
  );
  console.log('Games found:', gameCount);

  const MAX_GAMES = parseInt(process.env.MAX_GAMES || '20');
  const allGames = [];

  for (let i = 0; i < Math.min(gameCount, MAX_GAMES); i++) {
    console.log(`Processing game ${i + 1}...`);

    // Scroll the game row into view, then click expand
    await page.evaluate((idx) => {
      const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
      rows[idx]?.scrollIntoView({ block: 'center' });
    }, i);
    await new Promise(r => setTimeout(r, 500));

    const clicked = await page.evaluate((idx) => {
      const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
      const row = rows[idx];
      if (!row) return false;
      const btns = row.querySelectorAll('button');
      for (const btn of btns) {
        const sr = btn.querySelector('.sr-only');
        if (sr && sr.textContent.includes('Show More Detail') && btn.offsetParent !== null) {
          btn.click();
          return true;
        }
      }
      return false;
    }, i);
    if (!clicked) console.log('  Warning: could not click expand');
    // Wait for expand to load (first game may need longer)
    await new Promise(r => setTimeout(r, i === 0 ? 5000 : 3000));

    // Extract everything at once
    const game = await page.evaluate((idx) => {
      const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
      const row = rows[idx];
      if (!row) return null;

      const text = row.textContent;

      // Result
      let result = 'Unknown';
      const strongs = row.querySelectorAll('strong');
      for (const s of strongs) {
        const t = s.textContent.trim();
        if (t === 'Victory') { result = 'Win'; break; }
        if (t === 'Defeat') { result = 'Loss'; break; }
      }

      // Champion
      const champLink = row.querySelector('a[href*="/champions/"]');
      const champImg = champLink ? champLink.querySelector('img') : null;
      const champion = champImg ? champImg.alt : '';

      // Game mode
      let gameMode = 'Unknown';
      for (const mode of ['Ranked Solo', 'Ranked Flex', 'Normal', 'ARAM', 'Arena']) {
        if (text.includes(mode)) { gameMode = mode; break; }
      }

      // KDA - more specific: find the styled KDA section
      let kills = 0, deaths = 0, assists = 0;
      const kdaDiv = row.querySelector('div[class*="items-center gap-1 text-[15px]"]');
      if (kdaDiv) {
        const nums = kdaDiv.querySelectorAll('strong');
        if (nums.length >= 3) {
          kills = parseInt(nums[0].textContent) || 0;
          deaths = parseInt(nums[1].textContent) || 0;
          assists = parseInt(nums[2].textContent) || 0;
        }
      } else {
        const kdaMatch = text.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
        if (kdaMatch) { kills = parseInt(kdaMatch[1]); deaths = parseInt(kdaMatch[2]); assists = parseInt(kdaMatch[3]); }
      }

      // CS
      const csEl = row.querySelector('.cs, [class*="cs"]');
      let cs = 0, csPerMin = 0;
      if (csEl) {
        const csMatch = csEl.textContent.match(/CS\s*(\d+)\s*\((\d+(?:\.\d+)?)\)/);
        if (csMatch) { cs = parseInt(csMatch[1]); csPerMin = parseFloat(csMatch[2]); }
        else {
          const m2 = csEl.textContent.match(/(\d+)/);
          if (m2) cs = parseInt(m2[1]);
        }
      } else {
        const csMatch = text.match(/(\d+)\s*CS/);
        if (csMatch) cs = parseInt(csMatch[1]);
      }

      // Duration
      const durMatch = text.match(/(\d+m\s*\d+s)/);
      const duration = durMatch ? durMatch[1] : '';

      // Timestamp
      const timeEl = row.querySelector('[data-tooltip-content*="/"]');
      const timeAgo = timeEl ? timeEl.textContent.trim() : '';
      const timestamp = timeEl ? timeEl.getAttribute('data-tooltip-content') : '';

      // Items (main player)
      const items = Array.from(row.querySelectorAll('ul img[src*="/item/"]'))
        .map(img => ({ name: img.alt, id: img.src.match(/item\/(\d+)/)?.[1] }));

      // Spells
      const spells = Array.from(row.querySelectorAll('img[src*="/spell/"]'))
        .map(img => img.alt);

      // Participants from compact view (right side of game row)
      const compactParticipants = [];
      const participantLinks = row.querySelectorAll('a[href*="/summoners/"]');
      participantLinks.forEach(a => {
        const name = a.querySelector('span')?.textContent?.trim() || a.textContent.trim();
        const pChampImg = a.querySelector('img[src*="/champion/"]');
        const pChamp = pChampImg ? pChampImg.alt : '';
        if (name && name.length < 30) {
          compactParticipants.push({ name, champion: pChamp });
        }
      });

      // Expanded participants
      const expandedParticipants = [];
      const next = row.nextElementSibling;
      if (next && next.classList.contains('space-y-2')) {
        const tables = next.querySelectorAll('table');
        for (const table of tables) {
          const thead = table.querySelector('thead');
          if (!thead) continue;
          const hText = thead.textContent;
          if (!hText.includes('Victory') && !hText.includes('Defeat')) continue;

          let team = hText.includes('Blue') ? 'blue' : hText.includes('Red') ? 'red' : 'unknown';
          let teamResult = hText.includes('Victory') ? 'Win' : hText.includes('Defeat') ? 'Loss' : 'Unknown';

          const trs = table.querySelectorAll('tbody tr:not(.ad)');
          for (const tr of trs) {
            const pChampImg = tr.querySelector('a[href*="/champions/"] img');
            const pChampion = pChampImg ? pChampImg.alt : '';

            const pLink = tr.querySelector('a[href*="/summoners/"]');
            const pName = pLink ? pLink.textContent.trim() : '';
            const pHref = pLink ? pLink.getAttribute('href') : '';

            const pItems = Array.from(tr.querySelectorAll('img[src*="/item/"]'))
              .map(img => ({ name: img.alt || '', id: img.src.match(/item\/(\d+)/)?.[1] || '' }));

            const tds = tr.querySelectorAll('td');
            let kda = '', damage = '', wards = '', pCs = '';
            if (tds.length >= 6) {
              kda = tds[2]?.textContent?.trim() || '';
              damage = tds[3]?.textContent?.trim()?.replace(/,/g, '') || '';
              wards = tds[4]?.textContent?.trim() || '';
              pCs = tds[5]?.textContent?.trim() || '';
            }

            if (pChampion || pName) {
              expandedParticipants.push({ team, teamResult, champion: pChampion, summonerName: pName, summonerHref: pHref, kda, damage, wards, cs: pCs, items: pItems });
            }
          }
        }
      }

      return {
        champion, gameMode, result, kills, deaths, assists, cs, csPerMin,
        duration, timeAgo, timestamp, items, spells,
        compactParticipants,
        participants: expandedParticipants,
        _expandedFound: !!(next && next.classList.contains('space-y-2')),
        gameIndex: idx,
      };
    }, i);

    if (game) {
      allGames.push(game);
      console.log(`  ${game.result} ${game.champion} ${game.kills}/${game.deaths}/${game.assists} | ${game.participants.length} participants | expanded: ${game._expandedFound}`);
    }

    // Close expand
    await page.evaluate((idx) => {
      const rows = document.querySelectorAll('div[class*="border-l-"][class*="game-item-color"]');
      const row = rows[idx];
      if (!row) return;
      const btns = row.querySelectorAll('button');
      for (const btn of btns) {
        const sr = btn.querySelector('.sr-only');
        if (sr && sr.textContent.includes('Show More Detail') && btn.offsetParent !== null) {
          btn.click();
          return;
        }
      }
    }, i);
    await new Promise(r => setTimeout(r, 500));
  }

  fs.writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/games-v2.json', JSON.stringify(allGames, null, 2));
  console.log(`\nDone! Saved ${allGames.length} games`);

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
