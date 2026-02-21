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

  console.log('Navigating to op.gg...');
  await page.goto('https://www.op.gg/summoners/na/izakr-na2', { waitUntil: 'networkidle2', timeout: 60000 });

  // Wait for game list to load
  await page.waitForSelector('[class*="GameItemWrap"], [class*="GameItem"], .css-1gpt2bv', { timeout: 30000 }).catch(() => {});
  await new Promise(r => setTimeout(r, 5000));

  // Save page HTML for debugging
  const html = await page.content();
  require('fs').writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/page.html', html);
  console.log('Saved page HTML (' + html.length + ' chars)');

  // Extract profile info
  const profile = await page.evaluate(() => {
    const getText = (sel) => {
      const el = document.querySelector(sel);
      return el ? el.textContent.trim() : '';
    };

    // Try multiple selector patterns for rank info
    let tier = '', lp = '', wins = '', losses = '';
    
    // Rank info
    const rankEl = document.querySelector('[class*="TierRank"]') || document.querySelector('[class*="tier-rank"]');
    if (rankEl) tier = rankEl.textContent.trim();
    
    const lpEl = document.querySelector('[class*="LeaguePoints"]') || document.querySelector('[class*="lp"]');
    if (lpEl) lp = lpEl.textContent.trim();

    // Try getting from the tier info section
    const tierInfo = document.querySelector('[class*="TierInfo"]');
    if (tierInfo) {
      const text = tierInfo.textContent;
      const tierMatch = text.match(/(Iron|Bronze|Silver|Gold|Platinum|Emerald|Diamond|Master|Grandmaster|Challenger)\s*(I|II|III|IV)?/i);
      if (tierMatch) tier = tierMatch[0];
      const lpMatch = text.match(/(\d+)\s*LP/);
      if (lpMatch) lp = lpMatch[1];
    }

    // Win/Loss
    const wlEl = document.querySelector('[class*="WinLose"]') || document.querySelector('[class*="win-lose"]');
    if (wlEl) {
      const text = wlEl.textContent;
      const wMatch = text.match(/(\d+)W/);
      const lMatch = text.match(/(\d+)L/);
      if (wMatch) wins = wMatch[1];
      if (lMatch) losses = lMatch[1];
    }

    // Level
    const levelEl = document.querySelector('[class*="Level"]') || document.querySelector('[class*="level"]');
    let level = levelEl ? levelEl.textContent.trim().replace(/[^\d]/g, '') : '';

    // Profile icon
    const profileImg = document.querySelector('[class*="ProfileIcon"] img, [class*="profile-icon"] img');
    const profileIconUrl = profileImg ? profileImg.src : '';

    // Summoner name
    const nameEl = document.querySelector('[class*="Name"] h1, [class*="summoner-name"], h1');
    const name = nameEl ? nameEl.textContent.trim() : 'izakr';

    return { name, level, tier, lp, wins, losses, profileIconUrl };
  });

  console.log('Profile:', JSON.stringify(profile));

  // Extract games
  const games = await page.evaluate(() => {
    const gameElements = document.querySelectorAll('[class*="GameItemWrap"], [class*="game-item"], li[class*="css-"]');
    const results = [];

    // Try to find game rows - op.gg uses various class patterns
    const allDivs = document.querySelectorAll('div[class*="Game"]');
    console.log('Found divs with Game class:', allDivs.length);

    // Look for the game list container
    const gameRows = document.querySelectorAll('[class*="GameItemList"] > div, [class*="css-"] > [class*="css-"]');
    
    // Try a broader approach - find elements that contain game data
    const potentialGames = [];
    document.querySelectorAll('div').forEach(div => {
      const cls = div.className || '';
      if (typeof cls === 'string' && (cls.includes('GameItem') || cls.includes('game-item'))) {
        potentialGames.push(div);
      }
    });

    const items = potentialGames.length > 0 ? potentialGames : gameElements;

    items.forEach((game, i) => {
      if (i >= 20) return;
      try {
        const text = game.textContent;
        const isWin = game.className.includes('--win') || game.querySelector('[class*="--win"]') !== null ||
                      text.includes('Victory') || (game.style && game.style.backgroundColor && game.style.backgroundColor.includes('blue'));
        
        // Check background color or class for win/loss
        const bgColor = getComputedStyle(game).backgroundColor;
        let result = 'Unknown';
        if (bgColor.includes('59, 130') || bgColor.includes('37, 99') || game.innerHTML.includes('Victory') || 
            game.className.includes('win') || game.querySelector('[class*="is-win"]')) {
          result = 'Win';
        } else if (bgColor.includes('239, 68') || bgColor.includes('220, 38') || game.innerHTML.includes('Defeat') ||
                   game.className.includes('lose') || game.querySelector('[class*="is-lose"]')) {
          result = 'Loss';
        }

        // Champion
        const champImg = game.querySelector('img[src*="champion"], img[alt]');
        const champName = champImg ? (champImg.alt || '') : '';
        const champImgUrl = champImg ? champImg.src : '';

        // KDA
        const kdaMatch = text.match(/(\d+)\s*\/\s*(\d+)\s*\/\s*(\d+)/);
        let kills = 0, deaths = 0, assists = 0;
        if (kdaMatch) {
          kills = parseInt(kdaMatch[1]);
          deaths = parseInt(kdaMatch[2]);
          assists = parseInt(kdaMatch[3]);
        }

        // CS
        const csMatch = text.match(/(\d+)\s*CS/i) || text.match(/(\d+)\s*\(\d+\.?\d*\)/);
        const cs = csMatch ? parseInt(csMatch[1]) : 0;
        const csMinMatch = text.match(/(\d+\.?\d*)\s*\/min/i) || text.match(/\((\d+\.?\d*)\)/);
        const csPerMin = csMinMatch ? parseFloat(csMinMatch[1]) : 0;

        // Duration
        const durMatch = text.match(/(\d+)m\s*(\d+)?s?/) || text.match(/(\d+):(\d+)/);
        const duration = durMatch ? durMatch[0] : '';

        // Game mode
        let gameMode = 'Ranked';
        if (text.includes('Normal')) gameMode = 'Normal';
        else if (text.includes('ARAM')) gameMode = 'ARAM';
        else if (text.includes('Ranked Solo')) gameMode = 'Ranked Solo';
        else if (text.includes('Ranked Flex')) gameMode = 'Ranked Flex';

        // Items
        const itemImgs = game.querySelectorAll('img[src*="item"]');
        const items = Array.from(itemImgs).map(img => img.src).filter(s => s.includes('item'));

        // Summoner spells
        const spellImgs = game.querySelectorAll('img[src*="spell"]');
        const spells = Array.from(spellImgs).map(img => img.src);

        // Participants
        const participants = [];
        const participantLinks = game.querySelectorAll('a[href*="/summoners/"]');
        participantLinks.forEach(a => {
          const name = a.textContent.trim();
          const champImg = a.closest('div')?.querySelector('img');
          if (name && name.length < 30) {
            participants.push({ name, champion: champImg ? champImg.alt : '' });
          }
        });

        // Time ago
        const timeEl = game.querySelector('time, [class*="time"], [class*="Time"]');
        const timeAgo = timeEl ? timeEl.textContent.trim() : '';
        const dateTime = timeEl && timeEl.dateTime ? timeEl.dateTime : '';

        if (champName || kdaMatch) {
          results.push({
            champion: champName,
            championImg: champImgUrl,
            gameMode,
            result,
            kills, deaths, assists,
            cs, csPerMin,
            duration,
            timeAgo,
            dateTime,
            items,
            spells,
            participants
          });
        }
      } catch (e) {}
    });

    return results;
  });

  console.log('Extracted ' + games.length + ' games');

  // If we got no games, let's try the API approach
  if (games.length === 0) {
    console.log('No games found via DOM scraping, trying op.gg API...');
    
    // op.gg has an internal API we can try
    const apiData = await page.evaluate(async () => {
      try {
        const resp = await fetch('https://op.gg/api/v1.0/internal/bypass/games/na/summoners/izakr-na2?limit=20', {
          headers: { 'Accept': 'application/json' }
        });
        if (resp.ok) return await resp.json();
      } catch(e) {}
      
      // Try another pattern
      try {
        const resp = await fetch('/api/v1.0/internal/bypass/games/na/summoners/izakr-na2?limit=20');
        if (resp.ok) return await resp.json();
      } catch(e) {}
      
      return null;
    });

    if (apiData) {
      require('fs').writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/api-response.json', JSON.stringify(apiData, null, 2));
      console.log('Saved API response');
    }
  }

  // Save whatever we got
  require('fs').writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/games.json', JSON.stringify(games, null, 2));
  require('fs').writeFileSync('/home/ubuntu/.openclaw/workspace/climb-gg/data/profile.json', JSON.stringify(profile, null, 2));
  
  // Take a screenshot for debugging
  await page.screenshot({ path: '/home/ubuntu/.openclaw/workspace/climb-gg/data/screenshot.png', fullPage: true });
  console.log('Screenshot saved');

  await browser.close();
  console.log('Done!');
})().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
