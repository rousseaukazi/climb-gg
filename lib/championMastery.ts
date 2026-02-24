// Champion mastery tracking system

interface Game {
  champion: string;
  result: string;
  gameMode: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csPerMin: number;
  [key: string]: any;
}

interface MasteryProgress {
  champion: string;
  currentLevel: number;
  currentPoints: number;
  pointsToNext: number;
  totalGames: number;
  progressPercent: number;
  nextMilestone: string;
  masteryBadge: string;
  performance: {
    winRate: number;
    avgKDA: number;
    avgCS: number;
  };
  recentTrend: 'improving' | 'stable' | 'declining';
  achievements: string[];
}

// Mastery level thresholds (based on games played + performance)
const MASTERY_THRESHOLDS = {
  1: { games: 1, name: 'Novice', emoji: '🌱' },
  2: { games: 5, name: 'Learning', emoji: '📚' },
  3: { games: 10, name: 'Competent', emoji: '⚡' },
  4: { games: 20, name: 'Skilled', emoji: '🔥' },
  5: { games: 35, name: 'Expert', emoji: '⭐' },
  6: { games: 50, name: 'Master', emoji: '💎' },
  7: { games: 75, name: 'Grandmaster', emoji: '👑' }
};

export function calculateChampionMastery(games: Game[]): MasteryProgress[] {
  // Group games by champion
  const championData = new Map<string, Game[]>();
  
  games.forEach(game => {
    if (!championData.has(game.champion)) {
      championData.set(game.champion, []);
    }
    championData.get(game.champion)!.push(game);
  });

  const masteryProgress: MasteryProgress[] = [];

  championData.forEach((championGames, champion) => {
    const totalGames = championGames.length;
    const wins = championGames.filter(g => g.result === 'Win').length;
    const winRate = (wins / totalGames) * 100;

    // Calculate performance metrics
    const totalKills = championGames.reduce((sum, g) => sum + g.kills, 0);
    const totalDeaths = championGames.reduce((sum, g) => sum + g.deaths, 0);
    const totalAssists = championGames.reduce((sum, g) => sum + g.assists, 0);
    const totalCS = championGames.reduce((sum, g) => sum + g.cs, 0);
    
    const avgKDA = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : 99;
    const avgCS = totalCS / totalGames;

    // Determine current mastery level
    let currentLevel = 1;
    for (let level = 7; level >= 1; level--) {
      if (totalGames >= MASTERY_THRESHOLDS[level as keyof typeof MASTERY_THRESHOLDS].games) {
        currentLevel = level;
        break;
      }
    }

    // Calculate points and progress to next level
    const currentThreshold = MASTERY_THRESHOLDS[currentLevel as keyof typeof MASTERY_THRESHOLDS];
    const nextLevel = Math.min(currentLevel + 1, 7);
    const nextThreshold = MASTERY_THRESHOLDS[nextLevel as keyof typeof MASTERY_THRESHOLDS];
    
    const currentPoints = calculateMasteryPoints(championGames);
    const pointsToNext = nextLevel <= 7 ? (nextThreshold.games - totalGames) : 0;
    const progressPercent = nextLevel <= 7 ? 
      Math.min(100, (totalGames / nextThreshold.games) * 100) : 100;

    // Determine recent trend (last 5 games vs previous 5)
    const recentGames = championGames.slice(0, Math.min(5, championGames.length));
    const previousGames = championGames.slice(5, Math.min(10, championGames.length));
    
    let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
    
    if (recentGames.length >= 3 && previousGames.length >= 3) {
      const recentWinRate = (recentGames.filter(g => g.result === 'Win').length / recentGames.length) * 100;
      const previousWinRate = (previousGames.filter(g => g.result === 'Win').length / previousGames.length) * 100;
      
      if (recentWinRate > previousWinRate + 20) {
        recentTrend = 'improving';
      } else if (recentWinRate < previousWinRate - 20) {
        recentTrend = 'declining';
      }
    }

    // Generate achievements
    const achievements = generateAchievements(championGames, champion);

    masteryProgress.push({
      champion,
      currentLevel,
      currentPoints,
      pointsToNext,
      totalGames,
      progressPercent,
      nextMilestone: nextLevel <= 7 ? 
        `${nextThreshold.name} (${nextThreshold.games} games)` : 
        'Max Level Achieved!',
      masteryBadge: `${currentThreshold.emoji} ${currentThreshold.name}`,
      performance: {
        winRate,
        avgKDA: Number(avgKDA.toFixed(2)),
        avgCS: Number(avgCS.toFixed(0))
      },
      recentTrend,
      achievements
    });
  });

  return masteryProgress.sort((a, b) => b.totalGames - a.totalGames);
}

function calculateMasteryPoints(games: Game[]): number {
  // Base points = games played
  let points = games.length * 100;
  
  // Bonus points for performance
  games.forEach(game => {
    // Win bonus
    if (game.result === 'Win') points += 50;
    
    // KDA bonus (S+ performance)
    const kda = game.deaths > 0 ? (game.kills + game.assists) / game.deaths : 99;
    if (kda >= 5) points += 30;
    else if (kda >= 3) points += 20;
    else if (kda >= 2) points += 10;
    
    // CS bonus (good farming)
    if (game.csPerMin >= 7) points += 25;
    else if (game.csPerMin >= 6) points += 15;
    else if (game.csPerMin >= 5) points += 10;
    
    // Ranked game bonus
    if (game.gameMode === 'Ranked Solo') points += 25;
  });
  
  return points;
}

function generateAchievements(games: Game[], champion: string): string[] {
  const achievements: string[] = [];
  const totalGames = games.length;
  const wins = games.filter(g => g.result === 'Win').length;
  const winRate = (wins / totalGames) * 100;
  
  // Win rate achievements
  if (winRate >= 80 && totalGames >= 5) {
    achievements.push('🏆 Champion Dominance (80%+ WR)');
  } else if (winRate >= 70 && totalGames >= 10) {
    achievements.push('⭐ Mastery Excellence (70%+ WR)');
  } else if (winRate >= 60 && totalGames >= 15) {
    achievements.push('🎯 Consistent Performer (60%+ WR)');
  }
  
  // Game count achievements
  if (totalGames >= 50) {
    achievements.push('💪 Dedication Master (50+ Games)');
  } else if (totalGames >= 25) {
    achievements.push('🔥 Committed Player (25+ Games)');
  } else if (totalGames >= 10) {
    achievements.push('📈 Getting Serious (10+ Games)');
  }
  
  // Performance achievements
  const totalKills = games.reduce((sum, g) => sum + g.kills, 0);
  const totalDeaths = games.reduce((sum, g) => sum + g.deaths, 0);
  const totalAssists = games.reduce((sum, g) => sum + g.assists, 0);
  const avgKDA = totalDeaths > 0 ? (totalKills + totalAssists) / totalDeaths : 99;
  
  if (avgKDA >= 4) {
    achievements.push('💎 KDA Legend (4.0+ Average)');
  } else if (avgKDA >= 3) {
    achievements.push('⚡ KDA Expert (3.0+ Average)');
  }
  
  // Special achievements
  const perfectGames = games.filter(g => g.deaths === 0 && g.result === 'Win').length;
  if (perfectGames >= 3) {
    achievements.push('👑 Deathless Warrior (3+ Perfect Games)');
  }
  
  // Recent performance
  const recentGames = games.slice(0, 5);
  if (recentGames.length >= 5 && recentGames.every(g => g.result === 'Win')) {
    achievements.push('🔥 Hot Streak (5 Win Streak)');
  }
  
  return achievements;
}

export function getMasteryRecommendations(masteryData: MasteryProgress[]): string[] {
  const recommendations: string[] = [];
  
  // Find champions close to next level
  const closeToUpgrade = masteryData.filter(m => 
    m.pointsToNext > 0 && m.pointsToNext <= 5 && m.performance.winRate >= 50
  );
  
  if (closeToUpgrade.length > 0) {
    const champ = closeToUpgrade[0];
    recommendations.push(
      `🎯 ${champ.champion} is ${champ.pointsToNext} games away from ${champ.nextMilestone}`
    );
  }
  
  // Recommend focusing on improving champions
  const improvingChamps = masteryData.filter(m => 
    m.recentTrend === 'improving' && m.totalGames >= 5
  );
  
  if (improvingChamps.length > 0) {
    recommendations.push(
      `📈 You're improving on ${improvingChamps[0].champion} - keep playing!`
    );
  }
  
  // Warn about declining performance
  const decliningChamps = masteryData.filter(m => 
    m.recentTrend === 'declining' && m.totalGames >= 10
  );
  
  if (decliningChamps.length > 0) {
    recommendations.push(
      `⚠️ Consider taking a break from ${decliningChamps[0].champion} or reviewing gameplay`
    );
  }
  
  return recommendations;
}