import profileData from "../data/profile.json";
import gamesData from "../data/games.json";

interface Game {
  champion: string;
  championImg: string;
  gameMode: string;
  result: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  csPerMin: number;
  duration: string;
  timeAgo: string;
  items: string[];
  spells: string[];
  participants: { name: string; champion: string }[];
}

const games = gamesData as Game[];
const profile = profileData as {
  name: string;
  tag: string;
  tier: string;
  lp: number;
  wins: number;
  losses: number;
  ladderRank: string;
};

function getTierColor(tier: string) {
  const t = tier.toLowerCase();
  if (t.includes("iron")) return "text-gray-400";
  if (t.includes("bronze")) return "text-amber-600";
  if (t.includes("silver")) return "text-gray-300";
  if (t.includes("gold")) return "text-yellow-400";
  if (t.includes("platinum")) return "text-cyan-400";
  if (t.includes("emerald")) return "text-emerald-400";
  if (t.includes("diamond")) return "text-blue-300";
  if (t.includes("master")) return "text-purple-400";
  if (t.includes("grandmaster")) return "text-red-400";
  if (t.includes("challenger")) return "text-amber-300";
  return "text-gray-400";
}

function getResultStyles(result: string) {
  if (result === "Win") return { border: "border-l-blue-500", bg: "bg-blue-500/5", badge: "bg-blue-600", text: "text-blue-400" };
  if (result === "Loss") return { border: "border-l-red-500", bg: "bg-red-500/5", badge: "bg-red-600", text: "text-red-400" };
  return { border: "border-l-gray-500", bg: "bg-gray-500/5", badge: "bg-gray-600", text: "text-gray-400" };
}

function kdaColor(kda: number) {
  if (kda >= 5) return "text-amber-400";
  if (kda >= 3) return "text-blue-400";
  if (kda >= 2) return "text-green-400";
  return "text-gray-400";
}

function getRankEmblem(tier: string) {
  const t = tier.toLowerCase().split(" ")[0];
  // Use a simple SVG emblem
  const colors: Record<string, string> = {
    iron: "#6b7280", bronze: "#b45309", silver: "#94a3b8",
    gold: "#eab308", platinum: "#22d3ee", emerald: "#10b981",
    diamond: "#60a5fa", master: "#a855f7", grandmaster: "#ef4444",
    challenger: "#f59e0b",
  };
  const color = colors[t] || "#6b7280";
  return (
    <div className="relative w-24 h-24 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        <polygon
          points="50,5 61,35 95,35 68,55 79,85 50,67 21,85 32,55 5,35 39,35"
          fill={color}
          opacity="0.15"
          stroke={color}
          strokeWidth="2"
        />
        <text x="50" y="52" textAnchor="middle" dominantBaseline="middle"
          fill={color} fontSize="14" fontWeight="bold">
          {tier.split(" ").map(w => w[0]?.toUpperCase()).join("")}
        </text>
      </svg>
    </div>
  );
}

export default function Home() {
  const winRate = profile.wins + profile.losses > 0
    ? Math.round((profile.wins / (profile.wins + profile.losses)) * 100)
    : 0;

  const totalGames = games.length;
  const wins = games.filter(g => g.result === "Win").length;
  const losses = games.filter(g => g.result === "Loss").length;
  const avgKills = (games.reduce((s, g) => s + g.kills, 0) / totalGames).toFixed(1);
  const avgDeaths = (games.reduce((s, g) => s + g.deaths, 0) / totalGames).toFixed(1);
  const avgAssists = (games.reduce((s, g) => s + g.assists, 0) / totalGames).toFixed(1);
  const avgKDA = parseFloat(avgDeaths) > 0
    ? ((parseFloat(avgKills) + parseFloat(avgAssists)) / parseFloat(avgDeaths)).toFixed(2)
    : "Perfect";

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">climb.gg</span>
        </div>
        <h1 className="text-2xl font-bold">
          {profile.name}
          <span className="text-gray-500 font-normal text-lg ml-1">#{profile.tag}</span>
        </h1>
      </header>

      {/* Profile Card */}
      <div className="bg-[#1a1d26] rounded-xl p-6 mb-6 border border-gray-800/50">
        <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
          {/* Rank Emblem */}
          {getRankEmblem(profile.tier)}

          {/* Rank Info */}
          <div className="flex-1 text-center md:text-left">
            <p className={`text-2xl font-bold capitalize ${getTierColor(profile.tier)}`}>
              {profile.tier}
            </p>
            <p className="text-gray-400 text-sm mt-1">{profile.lp} LP</p>
            <p className="text-gray-500 text-xs mt-1">Ladder Rank #{profile.ladderRank}</p>
            <div className="flex gap-4 mt-3 justify-center md:justify-start">
              <div>
                <span className="text-blue-400 font-semibold">{profile.wins}W</span>
                <span className="text-gray-600 mx-1">/</span>
                <span className="text-red-400 font-semibold">{profile.losses}L</span>
              </div>
              <div className={`font-bold ${winRate >= 50 ? "text-blue-400" : "text-red-400"}`}>
                {winRate}%
              </div>
            </div>
          </div>

          {/* Recent Stats */}
          <div className="bg-[#242833] rounded-lg p-4 min-w-[200px]">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Last {totalGames} Games</p>
            <div className="flex items-baseline gap-1 mb-2">
              <span className="text-blue-400 font-bold text-lg">{wins}W</span>
              <span className="text-gray-600">/</span>
              <span className="text-red-400 font-bold text-lg">{losses}L</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-white font-medium">{avgKills}</span>
              <span className="text-gray-600">/</span>
              <span className="text-red-400 font-medium">{avgDeaths}</span>
              <span className="text-gray-600">/</span>
              <span className="text-white font-medium">{avgAssists}</span>
              <span className={`ml-2 font-bold ${kdaColor(parseFloat(avgKDA as string))}`}>
                {avgKDA} KDA
              </span>
            </div>
            {/* Win rate bar */}
            <div className="mt-3 h-1.5 bg-red-600/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${(wins / totalGames) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Game History */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-300 mb-4">Match History</h2>
        {games.map((game, i) => {
          const styles = getResultStyles(game.result);
          const kda = game.deaths > 0
            ? ((game.kills + game.assists) / game.deaths).toFixed(2)
            : "Perfect";

          return (
            <div
              key={i}
              className={`${styles.bg} ${styles.border} border-l-4 rounded-lg overflow-hidden transition-all hover:brightness-110`}
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3 p-3">
                {/* Game Mode & Result */}
                <div className="flex md:flex-col items-center md:items-start gap-2 md:gap-0.5 md:w-[100px] shrink-0">
                  <span className={`text-xs font-bold uppercase ${styles.text}`}>
                    {game.result}
                  </span>
                  <span className="text-[11px] text-gray-500">{game.gameMode}</span>
                  <span className="text-[11px] text-gray-600">{game.duration}</span>
                  <span className="text-[11px] text-gray-600">{game.timeAgo}</span>
                </div>

                {/* Champion + Spells */}
                <div className="flex items-center gap-2 shrink-0">
                  <div className="relative">
                    {game.championImg ? (
                      <img
                        src={game.championImg}
                        alt={game.champion}
                        className="w-12 h-12 rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center text-xs">
                        {game.champion?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {game.spells.slice(0, 2).map((spell, j) => (
                      <img key={j} src={spell} alt="" className="w-5 h-5 rounded" loading="lazy" />
                    ))}
                  </div>
                  <div className="ml-1">
                    <p className="text-sm font-medium text-white">{game.champion}</p>
                  </div>
                </div>

                {/* KDA */}
                <div className="flex flex-col items-center md:w-[120px] shrink-0">
                  <div className="flex items-baseline gap-0.5 text-sm">
                    <span className="text-white font-bold">{game.kills}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-red-400 font-bold">{game.deaths}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-white font-bold">{game.assists}</span>
                  </div>
                  <span className={`text-xs font-semibold ${kdaColor(parseFloat(kda))}`}>
                    {kda === "Perfect" ? "Perfect" : `${kda}:1`} KDA
                  </span>
                </div>

                {/* CS */}
                <div className="flex flex-col items-center md:w-[80px] shrink-0 text-xs text-gray-400">
                  <span className="text-white font-medium">{game.cs} CS</span>
                  <span>{game.csPerMin}/min</span>
                </div>

                {/* Items */}
                <div className="flex gap-0.5 flex-wrap">
                  {game.items.slice(0, 7).map((item, j) => (
                    <img key={j} src={item} alt="" className="w-7 h-7 rounded" loading="lazy" />
                  ))}
                </div>

                {/* Participants */}
                <div className="hidden lg:grid grid-cols-2 gap-x-4 gap-y-0 text-[11px] ml-auto shrink-0">
                  {game.participants.slice(0, 5).map((p, j) => (
                    <span key={j} className={`truncate max-w-[80px] ${p.name === "izakr" ? "text-white font-semibold" : "text-gray-500"}`}>
                      {p.name}
                    </span>
                  ))}
                  {game.participants.slice(5, 10).map((p, j) => (
                    <span key={j + 5} className={`truncate max-w-[80px] ${p.name === "izakr" ? "text-white font-semibold" : "text-gray-500"}`}>
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <footer className="mt-12 py-6 border-t border-gray-800/50 text-center text-xs text-gray-600">
        <p>climb.gg — built with data from op.gg</p>
        <p className="mt-1">Last updated: {new Date().toLocaleDateString()}</p>
      </footer>
    </div>
  );
}
