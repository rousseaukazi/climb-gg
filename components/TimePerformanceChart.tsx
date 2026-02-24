'use client';

import { analyzeTimePerformance, getOptimalPlayingHours, getHourlyWinRateChart } from '../lib/timeAnalysis';

interface TimePerformanceChartProps {
  games: Array<{
    timestamp: string;
    result: string;
    gameMode: string;
    kills: number;
    deaths: number;
    assists: number;
    champion: string;
    [key: string]: any;
  }>;
}

export default function TimePerformanceChart({ games }: TimePerformanceChartProps) {
  const timeInsights = analyzeTimePerformance(games);
  const recommendations = getOptimalPlayingHours(timeInsights);
  const hourlyChart = getHourlyWinRateChart(timeInsights);
  
  if (timeInsights.totalHoursPlayed === 0) return null;

  const maxWinRate = Math.max(...hourlyChart.map(h => h.winRate));
  
  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#37352f' }}>
        ⏰ Performance by Time
      </h2>

      {/* Time-based recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#37352f' }}>
            🎯 Timing Tips
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                background: rec.includes('Avoid') ? '#fdeaea' : '#e8f5e8',
                border: `1px solid ${rec.includes('Avoid') ? '#e03e3e' : '#48a868'}`,
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 13,
                color: '#37352f'
              }}>
                {rec.includes('Avoid') ? '⚠️' : '💡'} {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hourly win rate chart */}
      <div style={{
        background: '#f7f6f3',
        borderRadius: 8,
        padding: 20,
        marginBottom: 16,
        height: 200
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#37352f' }}>
          24-Hour Win Rate Distribution
        </h3>
        <div style={{ display: 'flex', alignItems: 'end', height: 140, gap: 2 }}>
          {hourlyChart.map(({ hour, winRate, games }) => {
            const heightPercent = maxWinRate > 0 ? (winRate / maxWinRate) * 100 : 0;
            const color = games === 0 ? '#e3e3e1' : 
                         winRate > 60 ? '#48a868' :
                         winRate > 50 ? '#e2b714' :
                         winRate > 0 ? '#e03e3e' : '#e3e3e1';
            
            return (
              <div key={hour} style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                flex: 1,
                minWidth: 16
              }}>
                <div style={{
                  height: `${Math.max(heightPercent, games > 0 ? 5 : 0)}%`,
                  backgroundColor: color,
                  width: '100%',
                  borderRadius: '2px 2px 0 0',
                  minHeight: games > 0 ? 4 : 0,
                  title: `${hour}:00 - ${winRate.toFixed(0)}% WR (${games} games)`
                }} />
                <div style={{
                  fontSize: 9,
                  color: '#9b9a97',
                  marginTop: 4,
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  whiteSpace: 'nowrap'
                }}>
                  {hour === 0 ? '12a' : hour === 12 ? '12p' : hour < 12 ? `${hour}a` : `${hour-12}p`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Time slot performance */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        marginBottom: 16
      }}>
        {[
          { key: 'morning', label: 'Morning', emoji: '🌅', time: '6AM-12PM' },
          { key: 'afternoon', label: 'Afternoon', emoji: '☀️', time: '12PM-6PM' },
          { key: 'evening', label: 'Evening', emoji: '🌆', time: '6PM-12AM' },
          { key: 'lateNight', label: 'Late Night', emoji: '🌙', time: '12AM-6AM' }
        ].map(slot => {
          const data = timeInsights.preferredTimeSlots[slot.key as keyof typeof timeInsights.preferredTimeSlots];
          const isActive = data.games > 0;
          const isBest = isActive && Object.values(timeInsights.preferredTimeSlots)
            .filter(d => d.games > 0)
            .every(d => d.winRate <= data.winRate);
          
          return (
            <div key={slot.key} style={{
              background: isActive ? (isBest ? '#e8f5e8' : '#f7f6f3') : '#fafafa',
              border: `1px solid ${isActive ? (isBest ? '#48a868' : '#e3e3e1') : '#f0f0f0'}`,
              borderRadius: 6,
              padding: 12,
              opacity: isActive ? 1 : 0.6
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 4
              }}>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: '#37352f',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span>{slot.emoji}</span>
                  {slot.label}
                  {isBest && isActive && <span style={{ 
                    fontSize: 10, 
                    background: '#48a868', 
                    color: 'white', 
                    padding: '2px 6px', 
                    borderRadius: 10,
                    fontWeight: 600
                  }}>BEST</span>}
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#9b9a97', marginBottom: 6 }}>
                {slot.time}
              </div>
              {isActive ? (
                <>
                  <div style={{ 
                    fontSize: 16, 
                    fontWeight: 700, 
                    color: data.winRate > 60 ? '#48a868' : data.winRate < 40 ? '#e03e3e' : '#37352f'
                  }}>
                    {data.winRate.toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 11, color: '#9b9a97' }}>
                    {data.games} games
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: '#9b9a97', fontStyle: 'italic' }}>
                  No games
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Best/worst hours summary */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12
      }}>
        {/* Best hours */}
        <div style={{
          background: '#e8f5e8',
          border: '1px solid #48a868',
          borderRadius: 6,
          padding: 12
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#2d5a2d', 
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            🏆 Best Hours
          </div>
          {timeInsights.bestHours.slice(0, 3).map((hour, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#2d5a2d',
              marginBottom: 4
            }}>
              <span>{hour.timeLabel}</span>
              <span>{hour.winRate.toFixed(0)}% ({hour.games}g)</span>
            </div>
          ))}
        </div>

        {/* Worst hours */}
        <div style={{
          background: '#fdeaea',
          border: '1px solid #e03e3e',
          borderRadius: 6,
          padding: 12
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: 600, 
            color: '#a33', 
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            ⚠️ Struggle Hours
          </div>
          {timeInsights.worstHours.slice(0, 3).map((hour, i) => (
            <div key={i} style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: '#a33',
              marginBottom: 4
            }}>
              <span>{hour.timeLabel}</span>
              <span>{hour.winRate.toFixed(0)}% ({hour.games}g)</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}