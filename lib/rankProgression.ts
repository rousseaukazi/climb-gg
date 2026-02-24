// Rank progression utilities for tracking LP/rank changes over time

interface RankDataPoint {
  date: Date;
  tier: string;
  lp: number;
  wins: number;
  losses: number;
  gameIndex?: number; // For linking to specific games
}

interface GameData {
  timestamp: string;
  result: string;
  gameMode: string;
  champion: string;
}

// Mock historical rank data (in real app, this would come from periodic scraping)
const HISTORICAL_RANK_DATA: RankDataPoint[] = [
  { date: new Date('2026-02-15'), tier: 'Bronze 1', lp: 85, wins: 75, losses: 82 },
  { date: new Date('2026-02-17'), tier: 'Silver 2', lp: 0, wins: 85, losses: 89 }, // Promotion
  { date: new Date('2026-02-20'), tier: 'Silver 2', lp: 45, wins: 90, losses: 92 },
  { date: new Date('2026-02-22'), tier: 'Silver 2', lp: 25, wins: 91, losses: 95 },
  { date: new Date('2026-02-23'), tier: 'Silver 2', lp: 18, wins: 92, losses: 97 }, // Current
];

export function getRankProgression(): RankDataPoint[] {
  return HISTORICAL_RANK_DATA.sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function calculateLPGains(games: GameData[]): Array<{date: Date, lpChange: number, result: string}> {
  // Estimate LP changes based on win/loss patterns
  const lpChanges: Array<{date: Date, lpChange: number, result: string}> = [];
  
  games.slice(0, 10).forEach(game => {
    if (game.gameMode !== 'Ranked Solo') return;
    
    const lpChange = game.result === 'Win' ? 
      Math.floor(Math.random() * 8) + 18 : // Win: 18-25 LP
      -(Math.floor(Math.random() * 8) + 16); // Loss: -16 to -23 LP
      
    lpChanges.push({
      date: new Date(game.timestamp),
      lpChange,
      result: game.result
    });
  });
  
  return lpChanges.reverse(); // Most recent first
}

export function getRankTierValue(tier: string): number {
  // Convert rank to numeric value for graphing
  const tierMap: Record<string, number> = {
    'Iron 4': 0, 'Iron 3': 1, 'Iron 2': 2, 'Iron 1': 3,
    'Bronze 4': 4, 'Bronze 3': 5, 'Bronze 2': 6, 'Bronze 1': 7,
    'Silver 4': 8, 'Silver 3': 9, 'Silver 2': 10, 'Silver 1': 11,
    'Gold 4': 12, 'Gold 3': 13, 'Gold 2': 14, 'Gold 1': 15,
    'Platinum 4': 16, 'Platinum 3': 17, 'Platinum 2': 18, 'Platinum 1': 19,
    'Emerald 4': 20, 'Emerald 3': 21, 'Emerald 2': 22, 'Emerald 1': 23,
    'Diamond 4': 24, 'Diamond 3': 25, 'Diamond 2': 26, 'Diamond 1': 27,
    'Master': 28, 'Grandmaster': 29, 'Challenger': 30
  };
  
  return tierMap[tier] || 0;
}

export function formatRankDisplay(tier: string, lp: number): string {
  if (['Master', 'Grandmaster', 'Challenger'].includes(tier)) {
    return `${tier} ${lp} LP`;
  }
  return `${tier} ${lp} LP`;
}