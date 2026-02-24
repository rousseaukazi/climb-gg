// Build analysis utilities for item optimization

interface GameItem {
  name: string;
  id: string;
}

interface Game {
  champion: string;
  result: string;
  gameMode: string;
  items?: GameItem[];
  [key: string]: any;
}

interface BuildPattern {
  items: string[];
  games: number;
  wins: number;
  winRate: number;
  avgKDA?: number;
  champions: string[];
}

interface ChampionBuildAnalysis {
  champion: string;
  totalGames: number;
  bestFirstItem: {
    item: string;
    winRate: number;
    games: number;
  } | null;
  worstFirstItem: {
    item: string;
    winRate: number;
    games: number;
  } | null;
  coreItems: {
    item: string;
    pickRate: number;
    winRate: number;
    games: number;
  }[];
  buildPaths: {
    path: string[];
    winRate: number;
    games: number;
  }[];
}

// Common item categories for better analysis
const ITEM_CATEGORIES = {
  'ADC_FIRST': ['Doran\'s Blade', 'Blade of The Ruined King', 'Galeforce', 'Kraken Slayer', 'Immortal Shieldbow'],
  'ADC_CORE': ['Infinity Edge', 'Phantom Dancer', 'Runaan\'s Hurricane', 'Rapid Firecannon', 'The Collector'],
  'ADC_MYTHIC': ['Galeforce', 'Kraken Slayer', 'Immortal Shieldbow'],
  'BOOTS': ['Berserker\'s Greaves', 'Boots of Swiftness', 'Plated Steelcaps', 'Mercury\'s Treads'],
  'DEFENSIVE': ['Guardian Angel', 'Maw of Malmortius', 'Bloodthirster', 'Mercurial Scimitar']
};

export function analyzeItemBuilds(games: Game[]): ChampionBuildAnalysis[] {
  const championData = new Map<string, Game[]>();
  
  // Group games by champion
  games.forEach(game => {
    if (game.gameMode !== 'Ranked Solo' || !game.items || game.items.length === 0) return;
    
    if (!championData.has(game.champion)) {
      championData.set(game.champion, []);
    }
    championData.get(game.champion)!.push(game);
  });

  const analyses: ChampionBuildAnalysis[] = [];

  championData.forEach((championGames, champion) => {
    if (championGames.length < 2) return; // Need at least 2 games for analysis

    const analysis: ChampionBuildAnalysis = {
      champion,
      totalGames: championGames.length,
      bestFirstItem: null,
      worstFirstItem: null,
      coreItems: [],
      buildPaths: []
    };

    // Analyze first item performance
    const firstItemStats = new Map<string, {wins: number, games: number}>();
    
    championGames.forEach(game => {
      const firstItem = getFirstItem(game.items || []);
      if (firstItem) {
        if (!firstItemStats.has(firstItem)) {
          firstItemStats.set(firstItem, {wins: 0, games: 0});
        }
        const stats = firstItemStats.get(firstItem)!;
        stats.games++;
        if (game.result === 'Win') stats.wins++;
      }
    });

    // Find best/worst first items (min 2 games)
    let bestWinRate = 0;
    let worstWinRate = 100;
    
    firstItemStats.forEach((stats, item) => {
      if (stats.games >= 2) {
        const winRate = (stats.wins / stats.games) * 100;
        
        if (winRate > bestWinRate) {
          bestWinRate = winRate;
          analysis.bestFirstItem = {
            item,
            winRate,
            games: stats.games
          };
        }
        
        if (winRate < worstWinRate) {
          worstWinRate = winRate;
          analysis.worstFirstItem = {
            item,
            winRate,
            games: stats.games
          };
        }
      }
    });

    // Analyze core item performance
    const itemStats = new Map<string, {picks: number, wins: number}>();
    
    championGames.forEach(game => {
      const items = (game.items || []).map(item => item.name);
      items.forEach(itemName => {
        if (!itemStats.has(itemName)) {
          itemStats.set(itemName, {picks: 0, wins: 0});
        }
        const stats = itemStats.get(itemName)!;
        stats.picks++;
        if (game.result === 'Win') stats.wins++;
      });
    });

    // Filter for items picked in at least 25% of games
    const minPickRate = Math.max(2, Math.floor(championGames.length * 0.25));
    
    itemStats.forEach((stats, item) => {
      if (stats.picks >= minPickRate) {
        analysis.coreItems.push({
          item,
          pickRate: (stats.picks / championGames.length) * 100,
          winRate: (stats.wins / stats.picks) * 100,
          games: stats.picks
        });
      }
    });

    // Sort core items by win rate
    analysis.coreItems.sort((a, b) => b.winRate - a.winRate);

    analyses.push(analysis);
  });

  return analyses.sort((a, b) => b.totalGames - a.totalGames);
}

function getFirstItem(items: GameItem[]): string | null {
  // Filter out boots, consumables, and wards
  const excludePatterns = [
    'Boots', 'Ward', 'Potion', 'Elixir', 'Oracle', 'Farsight', 'Doran', 'Quest',
    'Stealth Ward', 'Control Ward', 'Sweeping Lens'
  ];
  
  const realItems = items.filter(item => 
    !excludePatterns.some(pattern => item.name.includes(pattern))
  );
  
  return realItems.length > 0 ? realItems[0].name : null;
}

export function getBuildRecommendations(champion: string, analyses: ChampionBuildAnalysis[]) {
  const analysis = analyses.find(a => a.champion === champion);
  if (!analysis) return null;

  const recommendations = [];

  if (analysis.bestFirstItem && analysis.worstFirstItem && analysis.totalGames >= 5) {
    const improvement = analysis.bestFirstItem.winRate - analysis.worstFirstItem.winRate;
    if (improvement > 15) {
      recommendations.push({
        type: 'first_item',
        message: `Start ${analysis.bestFirstItem.item} instead of ${analysis.worstFirstItem.item}`,
        impact: `+${improvement.toFixed(0)}% win rate improvement`,
        confidence: analysis.bestFirstItem.games >= 3 ? 'High' : 'Medium'
      });
    }
  }

  // Find items with high win rate but low pick rate
  const underbuiltItems = analysis.coreItems.filter(item => 
    item.winRate > 60 && item.pickRate < 50 && item.games >= 2
  );
  
  underbuiltItems.forEach(item => {
    recommendations.push({
      type: 'underused_item',
      message: `Consider building ${item.item} more often`,
      impact: `${item.winRate.toFixed(0)}% win rate when built`,
      confidence: item.games >= 3 ? 'High' : 'Medium'
    });
  });

  return recommendations;
}

export function getItemEfficiency(games: Game[]) {
  const itemWinRates = new Map<string, {wins: number, games: number}>();
  
  games.forEach(game => {
    if (game.gameMode !== 'Ranked Solo' || !game.items) return;
    
    game.items.forEach(item => {
      if (!itemWinRates.has(item.name)) {
        itemWinRates.set(item.name, {wins: 0, games: 0});
      }
      const stats = itemWinRates.get(item.name)!;
      stats.games++;
      if (game.result === 'Win') stats.wins++;
    });
  });

  const efficiency = Array.from(itemWinRates.entries())
    .filter(([_, stats]) => stats.games >= 3)
    .map(([item, stats]) => ({
      item,
      winRate: (stats.wins / stats.games) * 100,
      games: stats.games,
      pickRate: (stats.games / games.length) * 100
    }))
    .sort((a, b) => b.winRate - a.winRate);

  return efficiency;
}