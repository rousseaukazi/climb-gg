'use client';

import { calculateChampionMastery, getMasteryRecommendations } from '../lib/championMastery';

interface ChampionMasteryTrackerProps {
  games: Array<{
    champion: string;
    result: string;
    gameMode: string;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    csPerMin: number;
    [key: string]: any;
  }>;
}

export default function ChampionMasteryTracker({ games }: ChampionMasteryTrackerProps) {
  const masteryData = calculateChampionMastery(games);
  const recommendations = getMasteryRecommendations(masteryData);
  
  if (masteryData.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#37352f' }}>
        🎯 Champion Mastery
      </h2>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#37352f' }}>
            💡 Mastery Focus
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recommendations.map((rec, i) => (
              <div key={i} style={{
                background: '#e8f5e8',
                border: '1px solid #48a868',
                borderRadius: 6,
                padding: '10px 12px',
                fontSize: 13,
                color: '#37352f'
              }}>
                {rec}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mastery Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16,
        marginBottom: 20
      }}>
        {masteryData.slice(0, 6).map(mastery => (
          <div key={mastery.champion} style={{
            background: '#f7f6f3',
            borderRadius: 8,
            padding: 16,
            border: '1px solid #e3e3e1',
            position: 'relative'
          }}>
            {/* Mastery Badge */}
            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              fontSize: 10,
              background: mastery.currentLevel >= 5 ? '#e2b714' : '#48a868',
              color: 'white',
              padding: '2px 6px',
              borderRadius: 10,
              fontWeight: 600
            }}>
              Level {mastery.currentLevel}
            </div>

            {/* Champion Header */}
            <div style={{ 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 4,
              color: '#37352f',
              paddingRight: 60
            }}>
              {mastery.champion}
            </div>
            
            <div style={{ fontSize: 12, color: '#9b9a97', marginBottom: 8 }}>
              {mastery.masteryBadge}
            </div>

            {/* Progress Bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#9b9a97',
                marginBottom: 4
              }}>
                <span>Progress to {mastery.nextMilestone.split('(')[0]}</span>
                <span>{Math.round(mastery.progressPercent)}%</span>
              </div>
              <div style={{
                width: '100%',
                background: '#e3e3e1',
                borderRadius: 6,
                height: 6,
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${Math.min(mastery.progressPercent, 100)}%`,
                  height: '100%',
                  background: mastery.currentLevel >= 5 ? '#e2b714' : '#48a868',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Performance Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 8,
              marginBottom: 10
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: mastery.performance.winRate >= 60 ? '#48a868' : mastery.performance.winRate < 40 ? '#e03e3e' : '#37352f'
                }}>
                  {mastery.performance.winRate.toFixed(0)}%
                </div>
                <div style={{ fontSize: 10, color: '#9b9a97' }}>Win Rate</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: mastery.performance.avgKDA >= 3 ? '#48a868' : mastery.performance.avgKDA < 2 ? '#e03e3e' : '#37352f'
                }}>
                  {mastery.performance.avgKDA}
                </div>
                <div style={{ fontSize: 10, color: '#9b9a97' }}>Avg KDA</div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#37352f' }}>
                  {mastery.totalGames}
                </div>
                <div style={{ fontSize: 10, color: '#9b9a97' }}>Games</div>
              </div>
            </div>

            {/* Trend Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 11
            }}>
              <span style={{
                color: mastery.recentTrend === 'improving' ? '#48a868' :
                       mastery.recentTrend === 'declining' ? '#e03e3e' : '#9b9a97'
              }}>
                {mastery.recentTrend === 'improving' ? '📈 Improving' :
                 mastery.recentTrend === 'declining' ? '📉 Declining' : '➡️ Stable'}
              </span>
              
              {mastery.pointsToNext > 0 && (
                <span style={{ color: '#9b9a97' }}>
                  {mastery.pointsToNext} games to next
                </span>
              )}
            </div>

            {/* Achievements */}
            {mastery.achievements.length > 0 && (
              <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #e3e3e1' }}>
                <div style={{ fontSize: 10, color: '#9b9a97', marginBottom: 4 }}>
                  Recent Achievements:
                </div>
                {mastery.achievements.slice(0, 2).map((achievement, i) => (
                  <div key={i} style={{
                    fontSize: 9,
                    color: '#37352f',
                    background: '#fff',
                    padding: '2px 6px',
                    borderRadius: 10,
                    display: 'inline-block',
                    marginRight: 4,
                    marginBottom: 2
                  }}>
                    {achievement}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mastery Overview */}
      <div style={{
        background: '#f7f6f3',
        borderRadius: 8,
        padding: 16,
        border: '1px solid #e3e3e1'
      }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#37352f', marginBottom: 8 }}>
          📊 Mastery Summary
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#e2b714' }}>
              {masteryData.filter(m => m.currentLevel >= 5).length}
            </div>
            <div style={{ fontSize: 11, color: '#9b9a97' }}>Expert+ Champions</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#48a868' }}>
              {masteryData.filter(m => m.recentTrend === 'improving').length}
            </div>
            <div style={{ fontSize: 11, color: '#9b9a97' }}>Improving</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#37352f' }}>
              {masteryData.reduce((sum, m) => sum + m.totalGames, 0)}
            </div>
            <div style={{ fontSize: 11, color: '#9b9a97' }}>Total Games</div>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#5b8af0' }}>
              {masteryData.reduce((sum, m) => sum + m.achievements.length, 0)}
            </div>
            <div style={{ fontSize: 11, color: '#9b9a97' }}>Achievements</div>
          </div>
        </div>
      </div>
    </div>
  );
}