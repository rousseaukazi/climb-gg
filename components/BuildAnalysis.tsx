'use client';

import { analyzeItemBuilds, getBuildRecommendations, getItemEfficiency } from '../lib/buildAnalysis';

interface BuildAnalysisProps {
  games: Array<{
    champion: string;
    result: string;
    gameMode: string;
    items?: Array<{name: string; id: string}>;
    [key: string]: any;
  }>;
}

export default function BuildAnalysis({ games }: BuildAnalysisProps) {
  const buildAnalyses = analyzeItemBuilds(games);
  const itemEfficiency = getItemEfficiency(games);
  
  if (buildAnalyses.length === 0) return null;

  return (
    <div style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: '#37352f' }}>
        🛠️ Build Analysis
      </h2>

      {/* Quick recommendations */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#37352f' }}>
          💡 Build Recommendations
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {buildAnalyses.slice(0, 3).map(analysis => {
            const recommendations = getBuildRecommendations(analysis.champion, buildAnalyses);
            if (!recommendations || recommendations.length === 0) return null;

            return (
              <div key={analysis.champion}>
                {recommendations.slice(0, 2).map((rec, i) => (
                  <div key={i} style={{
                    background: rec.type === 'first_item' ? '#e8f5e8' : '#fff7e6',
                    border: `1px solid ${rec.type === 'first_item' ? '#48a868' : '#e2b714'}`,
                    borderRadius: 6,
                    padding: '12px 14px',
                    fontSize: 14,
                    marginBottom: 8
                  }}>
                    <div style={{ fontWeight: 600, color: '#37352f', marginBottom: 4 }}>
                      {analysis.champion}: {rec.message}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#9b9a97',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}>
                      <span>{rec.impact}</span>
                      <span style={{ 
                        background: rec.confidence === 'High' ? '#48a868' : '#e2b714',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 600
                      }}>
                        {rec.confidence}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Champion-specific build analysis */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#37352f' }}>
          🏆 Champion Builds
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
          {buildAnalyses.slice(0, 4).map(analysis => (
            <div key={analysis.champion} style={{
              background: '#f7f6f3',
              borderRadius: 8,
              padding: 16,
              border: '1px solid #e3e3e1'
            }}>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                marginBottom: 8,
                color: '#37352f'
              }}>
                {analysis.champion}
              </div>
              <div style={{ fontSize: 12, color: '#9b9a97', marginBottom: 12 }}>
                {analysis.totalGames} ranked games analyzed
              </div>

              {/* Best first item */}
              {analysis.bestFirstItem && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#48a868', fontWeight: 600 }}>
                    ✅ Best Start: {analysis.bestFirstItem.item}
                  </div>
                  <div style={{ fontSize: 11, color: '#9b9a97' }}>
                    {analysis.bestFirstItem.winRate.toFixed(0)}% WR 
                    ({analysis.bestFirstItem.games} games)
                  </div>
                </div>
              )}

              {/* Worst first item */}
              {analysis.worstFirstItem && analysis.bestFirstItem && 
               analysis.worstFirstItem.item !== analysis.bestFirstItem.item && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 12, color: '#e03e3e', fontWeight: 600 }}>
                    ❌ Avoid: {analysis.worstFirstItem.item}
                  </div>
                  <div style={{ fontSize: 11, color: '#9b9a97' }}>
                    {analysis.worstFirstItem.winRate.toFixed(0)}% WR
                    ({analysis.worstFirstItem.games} games)
                  </div>
                </div>
              )}

              {/* Top core items */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#37352f', marginBottom: 6 }}>
                  Top Items:
                </div>
                {analysis.coreItems.slice(0, 3).map((item, i) => (
                  <div key={i} style={{ 
                    fontSize: 11, 
                    color: '#9b9a97',
                    marginBottom: 2,
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}>
                    <span>{item.item}</span>
                    <span style={{ 
                      color: item.winRate > 60 ? '#48a868' : item.winRate < 40 ? '#e03e3e' : '#37352f'
                    }}>
                      {item.winRate.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Item efficiency overview */}
      <div>
        <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 10, color: '#37352f' }}>
          📊 Item Win Rates
        </h3>
        <div style={{
          background: '#f7f6f3',
          borderRadius: 8,
          padding: 16,
          border: '1px solid #e3e3e1'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: 8 
          }}>
            {itemEfficiency.slice(0, 12).map((item, i) => (
              <div key={i} style={{
                fontSize: 12,
                padding: '6px 8px',
                background: 'white',
                borderRadius: 4,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                border: `1px solid ${
                  item.winRate > 70 ? '#48a868' : 
                  item.winRate > 60 ? '#e2b714' :
                  item.winRate < 40 ? '#e03e3e' : '#e3e3e1'
                }`
              }}>
                <span style={{ 
                  fontSize: 11,
                  fontWeight: 500,
                  color: '#37352f',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '100px'
                }}>
                  {item.item}
                </span>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontWeight: 600,
                    color: item.winRate > 60 ? '#48a868' : item.winRate < 40 ? '#e03e3e' : '#37352f'
                  }}>
                    {item.winRate.toFixed(0)}%
                  </div>
                  <div style={{ fontSize: 9, color: '#9b9a97' }}>
                    {item.games}g
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 11, color: '#9b9a97', textAlign: 'center' }}>
            Showing items with 3+ games • Ranked Solo only
          </div>
        </div>
      </div>
    </div>
  );
}