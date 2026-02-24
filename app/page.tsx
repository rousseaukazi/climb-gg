import gamesData from "../data/games-v2.json";
import RankProgressionChart from "../components/RankProgressionChart";
import BuildAnalysis from "../components/BuildAnalysis";

interface Game {
  champion: string;
  gameMode: string;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csPerMin: number;
  duration: string;
  timeAgo: string;
  timestamp: string;
  participants: { name: string; champion: string }[];
  [key: string]: unknown;
}

const games = gamesData as Game[];

// Filter out remakes
const realGames = games.filter((g) => g.result !== "Remake");
const wins = realGames.filter((g) => g.result === "Win");
const losses = realGames.filter((g) => g.result === "Loss");

// Champion stats
const champStats: Record<string, { games: number; wins: number; kills: number; deaths: number; assists: number; cs: number; totalMin: number }> = {};
realGames.forEach((g) => {
  if (!champStats[g.champion]) champStats[g.champion] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, cs: 0, totalMin: 0 };
  const s = champStats[g.champion];
  s.games++;
  if (g.result === "Win") s.wins++;
  s.kills += g.kills;
  s.deaths += g.deaths;
  s.assists += g.assists;
  s.cs += g.cs;
  const parts = g.duration.split(":");
  s.totalMin += parseInt(parts[0]) + parseInt(parts[1]) / 60;
});

// Duo partner stats
const duoStats: Record<string, { games: number; wins: number }> = {};
const knownAllies = ["izakm", "KillaKazi", "izakc", "TireRemote", "fInDVirginia"];
realGames.forEach((g) => {
  const myTeam = g.participants.slice(0, 5);
  myTeam.forEach((p) => {
    if (p.name !== "izakr" && knownAllies.includes(p.name)) {
      if (!duoStats[p.name]) duoStats[p.name] = { games: 0, wins: 0 };
      duoStats[p.name].games++;
      if (g.result === "Win") duoStats[p.name].wins++;
    }
  });
});

// Game length analysis
const winDurations = wins.map((g) => { const p = g.duration.split(":"); return parseInt(p[0]) + parseInt(p[1]) / 60; });
const lossDurations = losses.map((g) => { const p = g.duration.split(":"); return parseInt(p[0]) + parseInt(p[1]) / 60; });
const avgWinDuration = winDurations.length ? winDurations.reduce((a, b) => a + b, 0) / winDurations.length : 0;
const avgLossDuration = lossDurations.length ? lossDurations.reduce((a, b) => a + b, 0) / lossDurations.length : 0;

// KDA analysis
const avgKills = realGames.reduce((a, g) => a + g.kills, 0) / realGames.length;
const avgDeaths = realGames.reduce((a, g) => a + g.deaths, 0) / realGames.length;
const avgAssists = realGames.reduce((a, g) => a + g.assists, 0) / realGames.length;
const overallKDA = avgDeaths > 0 ? ((avgKills + avgAssists) / avgDeaths).toFixed(2) : "Perfect";

// Death analysis
const highDeathGames = realGames.filter((g) => g.deaths >= 8);
const lowDeathGames = realGames.filter((g) => g.deaths <= 3);
const highDeathWR = highDeathGames.length ? (highDeathGames.filter((g) => g.result === "Win").length / highDeathGames.length * 100).toFixed(0) : "N/A";
const lowDeathWR = lowDeathGames.length ? (lowDeathGames.filter((g) => g.result === "Win").length / lowDeathGames.length * 100).toFixed(0) : "N/A";

// CS analysis
const highCSGames = realGames.filter((g) => g.csPerMin >= 6.5);
const lowCSGames = realGames.filter((g) => g.csPerMin < 5.5);
const highCSWR = highCSGames.length ? (highCSGames.filter((g) => g.result === "Win").length / highCSGames.length * 100).toFixed(0) : "N/A";
const lowCSWR = lowCSGames.length ? (lowCSGames.filter((g) => g.result === "Win").length / lowCSGames.length * 100).toFixed(0) : "N/A";

// Streak analysis
let currentStreak = 0;
let streakType = realGames[0]?.result || "";
for (const g of realGames) {
  if (g.result === streakType) currentStreak++;
  else break;
}

function kda(k: number, d: number, a: number) {
  if (d === 0) return "Perfect";
  return ((k + a) / d).toFixed(2);
}

function kdaColor(k: number, d: number, a: number) {
  const val = d === 0 ? 99 : (k + a) / d;
  if (val >= 5) return "#e2b714";
  if (val >= 3) return "#5b8af0";
  if (val >= 2) return "#48a868";
  return "#999";
}

const tableWrap: React.CSSProperties = {
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  marginBottom: 32,
};

const th: React.CSSProperties = {
  padding: "10px 12px",
  color: "#9b9a97",
  fontWeight: 500,
  whiteSpace: "nowrap",
  borderBottom: "2px solid #e3e3e1",
  textAlign: "left",
};

const td: React.CSSProperties = {
  padding: "10px 12px",
  whiteSpace: "nowrap",
  borderBottom: "1px solid #f0f0ef",
};

export default function Home() {
  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 16px", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#37352f", background: "#fff", minHeight: "100vh" }}>
      
      {/* Header */}
      <div style={{ borderBottom: "1px solid #e3e3e1", paddingBottom: 16, marginBottom: 24 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, margin: 0, color: "#37352f" }}>climb.gg</h1>
        <p style={{ color: "#9b9a97", fontSize: 14, marginTop: 4 }}>izakr #NA2 · Silver 2 · 18 LP</p>
      </div>

      {/* Rank Progression */}
      <RankProgressionChart games={realGames} />

      {/* Overview */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#37352f" }}>📊 Overview</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
        {[
          { label: "Record", value: `${wins.length}W ${losses.length}L`, sub: `${(wins.length / realGames.length * 100).toFixed(0)}% WR` },
          { label: "KDA", value: overallKDA, sub: `${avgKills.toFixed(1)} / ${avgDeaths.toFixed(1)} / ${avgAssists.toFixed(1)}` },
          { label: "Avg CS/min", value: (realGames.reduce((a, g) => a + g.csPerMin, 0) / realGames.length).toFixed(1), sub: `${(realGames.reduce((a, g) => a + g.cs, 0) / realGames.length).toFixed(0)} avg CS` },
          { label: "Streak", value: `${currentStreak}${streakType === "Win" ? "W" : "L"}`, sub: streakType === "Win" ? "🔥 Hot" : "❄️ Cold" },
        ].map((stat, i) => (
          <div key={i} style={{ background: "#f7f6f3", borderRadius: 4, padding: "14px 12px" }}>
            <div style={{ fontSize: 11, color: "#9b9a97", textTransform: "uppercase", letterSpacing: "0.05em" }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: "#9b9a97", marginTop: 2 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Insights */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#37352f" }}>💡 Insights</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, marginBottom: 24 }}>
        <div style={{ background: "#f7f6f3", borderRadius: 4, padding: "14px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🎯 Deaths predict wins</div>
          <div style={{ fontSize: 13, color: "#48a868" }}>≤3 deaths → {lowDeathWR}% WR</div>
          <div style={{ fontSize: 13, color: "#e03e3e" }}>8+ deaths → {highDeathWR}% WR</div>
        </div>
        <div style={{ background: "#f7f6f3", borderRadius: 4, padding: "14px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🌾 CS matters</div>
          <div style={{ fontSize: 13, color: "#48a868" }}>≥6.5/min → {highCSWR}% WR</div>
          <div style={{ fontSize: 13, color: "#e03e3e" }}>&lt;5.5/min → {lowCSWR}% WR</div>
        </div>
        <div style={{ background: "#f7f6f3", borderRadius: 4, padding: "14px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>⏱️ Game length</div>
          <div style={{ fontSize: 13 }}>Avg win: <strong>{avgWinDuration.toFixed(0)}min</strong></div>
          <div style={{ fontSize: 13 }}>Avg loss: <strong>{avgLossDuration.toFixed(0)}min</strong></div>
        </div>
        <div style={{ background: "#f7f6f3", borderRadius: 4, padding: "14px" }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>🧪 Mel mid</div>
          <div style={{ fontSize: 13 }}>{champStats["Mel"]?.games || 0}g — {champStats["Mel"]?.wins || 0}W {(champStats["Mel"]?.games || 0) - (champStats["Mel"]?.wins || 0)}L</div>
          <div style={{ fontSize: 13, color: "#9b9a97" }}>{champStats["Mel"] && champStats["Mel"].wins / champStats["Mel"].games < 0.5 ? "Stick to ADC" : "Interesting"}</div>
        </div>
      </div>

      {/* Build Analysis */}
      <BuildAnalysis games={realGames} />

      {/* Champion Stats */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#37352f" }}>🏆 Champions</h2>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 480 }}>
          <thead>
            <tr>
              <th style={th}>Champion</th>
              <th style={th}>Games</th>
              <th style={th}>Win Rate</th>
              <th style={th}>KDA</th>
              <th style={th}>CS/min</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(champStats)
              .sort((a, b) => b[1].games - a[1].games)
              .map(([champ, s]) => (
                <tr key={champ}>
                  <td style={{ ...td, fontWeight: 500 }}>{champ}</td>
                  <td style={td}>{s.games}</td>
                  <td style={{ ...td, color: s.wins / s.games >= 0.6 ? "#48a868" : s.wins / s.games >= 0.5 ? "#37352f" : "#e03e3e" }}>
                    {(s.wins / s.games * 100).toFixed(0)}% ({s.wins}W {s.games - s.wins}L)
                  </td>
                  <td style={{ ...td, color: kdaColor(s.kills, s.deaths, s.assists) }}>
                    {kda(s.kills, s.deaths, s.assists)}
                  </td>
                  <td style={td}>{(s.cs / s.totalMin).toFixed(1)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {/* Duo Stats */}
      {Object.keys(duoStats).length > 0 && (
        <>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#37352f" }}>👥 Duo Partners</h2>
          <div style={tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, minWidth: 360 }}>
              <thead>
                <tr>
                  <th style={th}>Partner</th>
                  <th style={th}>Games</th>
                  <th style={th}>Win Rate</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(duoStats)
                  .sort((a, b) => b[1].games - a[1].games)
                  .map(([name, s]) => (
                    <tr key={name}>
                      <td style={{ ...td, fontWeight: 500 }}>{name}</td>
                      <td style={td}>{s.games}</td>
                      <td style={{ ...td, color: s.wins / s.games >= 0.6 ? "#48a868" : s.wins / s.games >= 0.5 ? "#37352f" : "#e03e3e" }}>
                        {(s.wins / s.games * 100).toFixed(0)}% ({s.wins}W {s.games - s.wins}L)
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Match History */}
      <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 12, color: "#37352f" }}>📋 Match History</h2>
      <div style={tableWrap}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 600 }}>
          <thead>
            <tr>
              <th style={{ ...th, width: 28 }}></th>
              <th style={th}>Champion</th>
              <th style={th}>Mode</th>
              <th style={th}>KDA</th>
              <th style={th}>CS</th>
              <th style={th}>Duration</th>
              <th style={th}>When</th>
            </tr>
          </thead>
          <tbody>
            {games.map((g, i) => (
              <tr key={i} style={{ opacity: g.result === "Remake" ? 0.4 : 1 }}>
                <td style={{ ...td, fontWeight: 700, color: g.result === "Win" ? "#48a868" : g.result === "Loss" ? "#e03e3e" : "#9b9a97" }}>
                  {g.result === "Win" ? "W" : g.result === "Loss" ? "L" : "R"}
                </td>
                <td style={{ ...td, fontWeight: 500 }}>{g.champion}</td>
                <td style={{ ...td, color: "#9b9a97" }}>{g.gameMode === "Ranked Solo" ? "Ranked" : "Normal"}</td>
                <td style={td}>
                  <span style={{ color: kdaColor(g.kills, g.deaths, g.assists) }}>{g.kills}/{g.deaths}/{g.assists}</span>
                  <span style={{ color: "#9b9a97", marginLeft: 6 }}>({kda(g.kills, g.deaths, g.assists)})</span>
                </td>
                <td style={td}>
                  {g.cs} <span style={{ color: "#9b9a97" }}>({g.csPerMin})</span>
                </td>
                <td style={{ ...td, color: "#9b9a97" }}>{g.duration}</td>
                <td style={{ ...td, color: "#9b9a97" }}>{g.timeAgo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 32, paddingTop: 12, borderTop: "1px solid #e3e3e1", color: "#9b9a97", fontSize: 12 }}>
        climb.gg · built by Roux 🫕 · data from op.gg
      </div>
    </div>
  );
}
