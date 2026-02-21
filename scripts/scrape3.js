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
  await new Promise(r => setTimeout(r, 3000));

  // Extract games using the actual class patterns we found
  const result = await page.evaluate(() => {
    // Games are divs with border-l-[6px] and game-item-color classes
    const gameRows = document.querySelectorAll('div[class*="border-l-[6px]"][class*="game-item-color"]');
    console.log('Found game rows:', gameRows.length);
    
    const games = [];
    gameRows.forEach((row, i) => {
      if (i >= 20) return;
      
      // Win/Loss from color theme
      const cls = row.className;
      let result = 'Unknown';
      if (cls.includes('colors.main')) result = 'Win';
      else if (cls.includes('colors.red')) result = 'Loss';
      else if (cls.includes('colors.gray')) result = 'Remake';

      // All images
      const imgs = row.querySelectorAll('img');
      const imgData = Array.from(imgs).map(img => ({
        src: img.src,
        alt: img.alt || '',
        width: img.width,
        className: img.className || ''
      }));

      // Champion - first large image (usually the champion icon)
      let champion = '', championImg = '';
      for (const img of imgs) {
        if (img.src.includes('champion') && !champion) {
          champion = img.alt || img.src.match(/champion\/(\w+)/)?.[1] || '';
          championImg = img.src;
          break;
        }
      }

      // Summoner spells
      const spells = Array.from(imgs)
        .filter(img => img.src.includes('spell'))
        .map(img => img.src);

      // Items
      const items = Array.from(imgs)
        .filter(img => img.src.includes('/item/'))
        .map(img => ({ src: img.src, id: img.src.match(/item\/(\d+)/)?.[1] }));

      // Text content - get structured text
      const text = row.textContent;
      
      // KDA - find kills/deaths/assists pattern
      const kdaMatch = text.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
      let kills = 0, deaths = 0, assists = 0;
      if (kdaMatch) {
        kills = parseInt(kdaMatch[1]);
        deaths = parseInt(kdaMatch[2]);
        assists = parseInt(kdaMatch[3]);
      }

      // CS
      const csMatch = text.match(/(\d+)\s*CS/);
      const cs = csMatch ? parseInt(csMatch[1]) : 0;
      const csMinMatch = text.match(/(\d+\.\d+)\s*\/m/);
      const csPerMin = csMinMatch ? parseFloat(csMinMatch[1]) : 0;

      // Duration
      const durMatch = text.match(/(\d+:\d+)/);
      const duration = durMatch ? durMatch[1] : '';

      // Game mode
      let gameMode = 'Unknown';
      if (text.includes('Ranked Solo')) gameMode = 'Ranked Solo';
      else if (text.includes('Ranked Flex')) gameMode = 'Ranked Flex';
      else if (text.includes('Normal')) gameMode = 'Normal';
      else if (text.includes('ARAM')) gameMode = 'ARAM';
      else if (text.includes('Arena')) gameMode = 'Arena';

      // Time ago
      const timeMatch = text.match(/(\d+\s*(day|hour|minute|second|week|month)s?\s*ago)/i);
      const timeAgo = timeMatch ? timeMatch[1] : '';

      // Participants - find links to summoner pages
      const participantLinks = row.querySelectorAll('a[href*="/summoners/"]');
      const participants = [];
      participantLinks.forEach(a => {
        const name = a.textContent.trim();
        // Get associated champion image
        const parentDiv = a.closest('div');
        const champImg = parentDiv ? parentDiv.querySelector('img[src*="champion"]') : null;
        const champName = champImg ? (champImg.alt || champImg.src.match(/champion\/(\w+)/)?.[1] || '') : '';
        if (name && name.length > 0 && name.length < 30) {
          participants.push({ name, champion: champName });
        }
      });

      // Win/Loss text
      const resultText = row.querySelector('[class*="game-item-color-600"]');
      if (resultText) {
        const rt = resultText.textContent.trim().toLowerCase();
        if (rt === 'victory' || rt === 'win' || rt === 'w') result = 'Win';
        else if (rt === 'defeat' || rt === 'loss' || rt === 'l') result = 'Loss';
      }

      games.push({
        champion, championImg, gameMode, result,
        kills, deaths, assists,
        cs, csPerMin, duration, timeAgo,
        items: items.map(i => i.src),
        spells,
        participants,
        _rawTextPreview: text.substring(0, 400)
      });
    });

    // Profile
    const profile = {};
    // Tier rank - look for specific sections
    const allText = document.body.textContent;
    
    // Summoner name
    profile.name = 'izakr';
    profile.tag = 'NA2';
    
    // Level
    const levelEls = document.querySelectorAll('span');
    for (const el of levelEls) {
      const t = el.textContent.trim();
      if (/^\d+$/.test(t) && parseInt(t) > 30 && parseInt(t) < 1000) {
        // Check if parent has "level" context
        const parent = el.parentElement;
        if (parent && parent.className.includes('evel')) {
          profile.level = parseInt(t);
          break;
        }
      }
    }

    // Rank info - find the ranked solo section
    // Look for elements with specific patterns
    const rankSection = document.querySelector('[class*="tier-rank"], [class*="TierRank"]');
    
    // More generic: find Silver, Gold etc text near LP
    const silverMatch = allText.match(/(Silver|Gold|Platinum|Diamond|Emerald|Bronze|Iron|Master|Grandmaster)\s*(I|II|III|IV|[1-4])?\s*(\d+)\s*LP/i);
    if (silverMatch) {
      profile.tier = silverMatch[1] + (silverMatch[2] ? ' ' + silverMatch[2] : '');
      profile.lp = parseInt(silverMatch[3]);
    }

    // Win/Loss
    const wlMatch = allText.match(/(\d+)W\s+(\d+)L/);
    if (wlMatch) {
      profile.wins = parseInt(wlMatch[1]);
      profile.losses = parseInt(wlMatch[2]);
    }

    // Win rate
    const wrMatch = allText.match(/(\d+)%/);

    // Ladder rank
    const ladderMatch = allText.match(/Ladder Rank\s*([\d,]+)/);
    if (ladderMatch) profile.ladderRank = ladderMatch[1];

    return { games, profile };
  });

  console.log('Games found:', result.games.length);
  console.log('Profile:', JSON.stringify(result.profile));
  if (result.games.length > 0) {
    console.log('First game:', JSON.stringify(result.games[0], null, 2));
  }

  fs.writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/games.json', JSON.stringify(result.games, null, 2));
  fs.writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/profile.json', JSON.stringify(result.profile, null, 2));

  await browser.close();
  console.log('Done!');
})().catch(e => { console.error(e); process.exit(1); });
