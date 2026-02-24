// Time-based performance analysis for optimal gaming hours

interface Game {
  timestamp: string;
  result: string;
  gameMode: string;
  kills: number;
  deaths: number;
  assists: number;
  champion: string;
  [key: string]: any;
}

interface HourlyStats {
  hour: number;
  games: number;
  wins: number;
  winRate: number;
  avgKDA: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  champions: string[];
  timeLabel: string;
}

interface TimeInsights {
  bestHours: HourlyStats[];
  worstHours: HourlyStats[];
  peakPerformanceTime: string;
  totalHoursPlayed: number;
  preferredTimeSlots: {
    morning: { games: number; winRate: number; }; // 6-12
    afternoon: { games: number; winRate: number; }; // 12-18
    evening: { games: number; winRate: number; }; // 18-24
    lateNight: { games: number; winRate: number; }; // 0-6
  };
}

export function analyzeTimePerformance(games: Game[]): TimeInsights {
  // Filter to ranked games only
  const rankedGames = games.filter(g => g.gameMode === 'Ranked Solo');
  
  if (rankedGames.length === 0) {
    return {
      bestHours: [],
      worstHours: [],
      peakPerformanceTime: 'N/A',
      totalHoursPlayed: 0,
      preferredTimeSlots: {
        morning: { games: 0, winRate: 0 },
        afternoon: { games: 0, winRate: 0 },
        evening: { games: 0, winRate: 0 },
        lateNight: { games: 0, winRate: 0 }
      }
    };
  }

  // Group games by hour
  const hourlyData = new Map<number, {
    games: Game[];
    wins: number;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
    champions: Set<string>;
  }>();

  rankedGames.forEach(game => {
    const date = new Date(game.timestamp);
    const hour = date.getHours();
    
    if (!hourlyData.has(hour)) {
      hourlyData.set(hour, {
        games: [],
        wins: 0,
        totalKills: 0,
        totalDeaths: 0,
        totalAssists: 0,
        champions: new Set()
      });
    }
    
    const hourData = hourlyData.get(hour)!;
    hourData.games.push(game);
    hourData.champions.add(game.champion);
    hourData.totalKills += game.kills;
    hourData.totalDeaths += game.deaths;
    hourData.totalAssists += game.assists;
    
    if (game.result === 'Win') {
      hourData.wins++;
    }
  });

  // Convert to HourlyStats array
  const hourlyStats: HourlyStats[] = Array.from(hourlyData.entries())
    .map(([hour, data]) => ({
      hour,
      games: data.games.length,
      wins: data.wins,
      winRate: (data.wins / data.games.length) * 100,
      avgKDA: data.totalDeaths > 0 ? (data.totalKills + data.totalAssists) / data.totalDeaths : 99,
      totalKills: data.totalKills,
      totalDeaths: data.totalDeaths,
      totalAssists: data.totalAssists,
      champions: Array.from(data.champions),
      timeLabel: formatHourLabel(hour)
    }))
    .filter(stat => stat.games >= 2) // Only include hours with at least 2 games
    .sort((a, b) => b.winRate - a.winRate);

  // Find best and worst performing hours
  const bestHours = hourlyStats.slice(0, 3);
  const worstHours = hourlyStats.slice(-3).reverse();

  // Calculate time slot performance
  const timeSlots = {
    morning: { games: 0, wins: 0 },    // 6-12
    afternoon: { games: 0, wins: 0 },  // 12-18  
    evening: { games: 0, wins: 0 },    // 18-24
    lateNight: { games: 0, wins: 0 }   // 0-6
  };

  rankedGames.forEach(game => {
    const hour = new Date(game.timestamp).getHours();
    const isWin = game.result === 'Win';
    
    if (hour >= 6 && hour < 12) {
      timeSlots.morning.games++;
      if (isWin) timeSlots.morning.wins++;
    } else if (hour >= 12 && hour < 18) {
      timeSlots.afternoon.games++;
      if (isWin) timeSlots.afternoon.wins++;
    } else if (hour >= 18 && hour < 24) {
      timeSlots.evening.games++;
      if (isWin) timeSlots.evening.wins++;
    } else {
      timeSlots.lateNight.games++;
      if (isWin) timeSlots.lateNight.wins++;
    }
  });

  const preferredTimeSlots = {
    morning: { 
      games: timeSlots.morning.games,
      winRate: timeSlots.morning.games > 0 ? (timeSlots.morning.wins / timeSlots.morning.games) * 100 : 0
    },
    afternoon: { 
      games: timeSlots.afternoon.games,
      winRate: timeSlots.afternoon.games > 0 ? (timeSlots.afternoon.wins / timeSlots.afternoon.games) * 100 : 0
    },
    evening: { 
      games: timeSlots.evening.games,
      winRate: timeSlots.evening.games > 0 ? (timeSlots.evening.wins / timeSlots.evening.games) * 100 : 0
    },
    lateNight: { 
      games: timeSlots.lateNight.games,
      winRate: timeSlots.lateNight.games > 0 ? (timeSlots.lateNight.wins / timeSlots.lateNight.games) * 100 : 0
    }
  };

  // Find peak performance time
  const peakHour = bestHours[0];
  const peakPerformanceTime = peakHour ? 
    `${peakHour.timeLabel} (${peakHour.winRate.toFixed(0)}% WR)` : 
    'N/A';

  return {
    bestHours,
    worstHours,
    peakPerformanceTime,
    totalHoursPlayed: hourlyStats.reduce((sum, stat) => sum + stat.games, 0),
    preferredTimeSlots
  };
}

function formatHourLabel(hour: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${period}`;
}

export function getOptimalPlayingHours(insights: TimeInsights): string[] {
  const recommendations: string[] = [];
  
  // Find the best performing time slots
  const timeSlotEntries = Object.entries(insights.preferredTimeSlots)
    .filter(([_, data]) => data.games >= 3) // Need sufficient data
    .sort(([_, a], [__, b]) => b.winRate - a.winRate);
  
  if (timeSlotEntries.length > 0) {
    const bestSlot = timeSlotEntries[0];
    const slotNames = {
      morning: 'mornings (6 AM - 12 PM)',
      afternoon: 'afternoons (12 PM - 6 PM)', 
      evening: 'evenings (6 PM - 12 AM)',
      lateNight: 'late nights (12 AM - 6 AM)'
    };
    
    recommendations.push(
      `Play during ${slotNames[bestSlot[0] as keyof typeof slotNames]} for best results (${bestSlot[1].winRate.toFixed(0)}% WR)`
    );
  }

  // Warn about worst performing hours
  if (insights.worstHours.length > 0) {
    const worstHour = insights.worstHours[0];
    if (worstHour.winRate < 40 && worstHour.games >= 3) {
      recommendations.push(
        `Avoid playing around ${worstHour.timeLabel} (${worstHour.winRate.toFixed(0)}% WR)`
      );
    }
  }

  // Performance consistency check
  const winRates = Object.values(insights.preferredTimeSlots)
    .filter(slot => slot.games >= 2)
    .map(slot => slot.winRate);
  
  if (winRates.length >= 2) {
    const variance = winRates.reduce((sum, wr) => sum + Math.pow(wr - (winRates.reduce((a, b) => a + b) / winRates.length), 2), 0) / winRates.length;
    
    if (variance > 400) { // High variance (>20% standard deviation)
      recommendations.push('Your performance varies significantly by time - focus on your best hours');
    }
  }

  return recommendations;
}

export function getHourlyWinRateChart(insights: TimeInsights): Array<{hour: number, winRate: number, games: number}> {
  // Create a complete 24-hour chart with zeros for hours not played
  const chartData: Array<{hour: number, winRate: number, games: number}> = [];
  
  for (let hour = 0; hour < 24; hour++) {
    const hourStat = insights.bestHours.concat(insights.worstHours)
      .find(stat => stat.hour === hour);
    
    chartData.push({
      hour,
      winRate: hourStat ? hourStat.winRate : 0,
      games: hourStat ? hourStat.games : 0
    });
  }
  
  return chartData;
}