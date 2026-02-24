'use client';

import { getRankProgression, calculateLPGains, getRankTierValue, formatRankDisplay } from '../lib/rankProgression';

interface RankProgressionChartProps {
  games: Array<{
    timestamp: string;
    result: string;
    gameMode: string;
    champion: string;
  }>;
}

export default function RankProgressionChart({ games }: RankProgressionChartProps) {
  const rankData = getRankProgression();
  const lpGains = calculateLPGains(games);
  
  if (rankData.length === 0) return null;

  const minRank = Math.min(...rankData.map(d => getRankTierValue(d.tier)));
  const maxRank = Math.max(...rankData.map(d => getRankTierValue(d.tier))) + 1;
  const rankRange = maxRank - minRank || 1;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#37352f' }}>
        📈 Rank Progression
      </h2>
      
      {/* Main chart area */}
      <div style={{ 
        background: '#f7f6f3', 
        borderRadius: 8, 
        padding: 20,
        marginBottom: 16,
        position: 'relative',
        height: 200
      }}>
        <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line 
              key={y}
              x1="0" 
              y1={`${y}%`} 
              x2="100%" 
              y2={`${y}%`}
              stroke="#e3e3e1" 
              strokeWidth={y === 50 ? 2 : 1}
              strokeDasharray={y === 50 ? "none" : "2,2"}
            />
          ))}
          
          {/* Rank progression line */}
          <polyline
            fill="none"
            stroke="#48a868"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={rankData.map((point, i) => {
              const x = (i / (rankData.length - 1)) * 100;
              const y = 100 - ((getRankTierValue(point.tier) - minRank) / rankRange) * 100;
              return `${x},${y}`;
            }).join(' ')}
          />
          
          {/* Data points */}
          {rankData.map((point, i) => {
            const x = (i / (rankData.length - 1)) * 100;
            const y = 100 - ((getRankTierValue(point.tier) - minRank) / rankRange) * 100;
            const isLatest = i === rankData.length - 1;
            
            return (
              <g key={i}>
                <circle
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r={isLatest ? "6" : "4"}
                  fill={isLatest ? "#e2b714" : "#48a868"}
                  stroke="white"
                  strokeWidth="2"
                />
                <text
                  x={`${x}%`}
                  y={`${y - 15}%`}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="#37352f"
                >
                  {point.tier.split(' ')[0]} {point.tier.split(' ')[1]}
                </text>
                <text
                  x={`${x}%`}
                  y={`${y + 25}%`}
                  textAnchor="middle" 
                  fontSize="10"
                  fill="#9b9a97"
                >
                  {point.lp} LP
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Recent LP changes */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: '#37352f' }}>
          Recent LP Changes
        </h3>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
          {lpGains.slice(0, 8).map((gain, i) => (
            <div 
              key={i}
              style={{ 
                background: gain.result === 'Win' ? '#e8f5e8' : '#fdeaea',
                border: `1px solid ${gain.result === 'Win' ? '#48a868' : '#e03e3e'}`,
                borderRadius: 4,
                padding: '6px 10px',
                fontSize: 12,
                fontWeight: 600,
                color: gain.result === 'Win' ? '#2d5a2d' : '#a33',
                whiteSpace: 'nowrap',
                minWidth: 'fit-content'
              }}
            >
              {gain.result === 'Win' ? '+' : ''}{gain.lpChange} LP
            </div>
          ))}
        </div>
      </div>

      {/* Stats summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { 
            label: 'Peak Rank', 
            value: formatRankDisplay(
              rankData.reduce((max, curr) => 
                getRankTierValue(curr.tier) > getRankTierValue(max.tier) ? curr : max
              ).tier, 
              rankData.reduce((max, curr) => 
                getRankTierValue(curr.tier) > getRankTierValue(max.tier) ? curr : max
              ).lp
            ),
            color: '#e2b714'
          },
          { 
            label: 'LP Trend', 
            value: rankData[rankData.length - 1].lp > rankData[0].lp ? '↗️ Rising' : '↘️ Falling',
            color: rankData[rankData.length - 1].lp > rankData[0].lp ? '#48a868' : '#e03e3e'
          },
          { 
            label: 'Games Since Promo', 
            value: `${rankData[rankData.length - 1].wins + rankData[rankData.length - 1].losses - 
              (rankData.find((d, i) => i > 0 && d.tier !== rankData[i-1].tier)?.wins || 0) -
              (rankData.find((d, i) => i > 0 && d.tier !== rankData[i-1].tier)?.losses || 0)} games`,
            color: '#37352f'
          }
        ].map((stat, i) => (
          <div key={i} style={{ background: '#f7f6f3', borderRadius: 4, padding: '10px' }}>
            <div style={{ fontSize: 10, color: '#9b9a97', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {stat.label}
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}