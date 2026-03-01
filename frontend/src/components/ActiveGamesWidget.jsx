import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaGamepad, FaUserFriends, FaRegClock } from "react-icons/fa";
import { gameAPI } from "../utils/api";

const ActiveGamesWidget = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const { data } = await gameAPI.getActiveGames();
        setGames(data);
      } catch (error) {
        console.error("Failed to fetch active games", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();

    // Refresh every 30 seconds
    const interval = setInterval(fetchGames, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading)
    return (
      <div className="bg-background-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 animate-pulse mb-6">
        <div className="h-6 bg-surface-light dark:bg-background-dark rounded w-1/2 mb-4"></div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-16 bg-surface-light dark:bg-background-dark rounded-xl"
            ></div>
          ))}
        </div>
      </div>
    );

  if (games.length === 0) return null;

  return (
    <div className="bg-background-light dark:bg-surface-dark rounded-xl shadow-sm border border-border-light dark:border-border-dark p-4 transition-colors mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-text-primary-light dark:text-text-primary-dark flex items-center gap-2">
          <FaGamepad className="text-secondary-light dark:text-secondary-dark" />
          Active Games
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full animate-pulse border border-green-500/20">
          Live
        </span>
      </div>

      <div className="space-y-3">
        {games.map((game) => (
          <div
            key={game._id}
            className="group relative border border-border-light dark:border-border-dark rounded-xl p-3 hover:border-secondary-light/50 dark:hover:border-secondary-dark/50 hover:bg-surface-light dark:hover:bg-background-dark transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-secondary-light/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative flex justify-between items-start mb-3">
              <div>
                <span className="font-mono font-bold text-secondary-light dark:text-secondary-dark text-lg tracking-widest">
                  {game.code}
                </span>
                <p className="text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark mt-0.5 uppercase tracking-wider">
                  {game.gameMode}
                </p>
              </div>
              <Link
                to={`/game?code=${game.code}`}
                className="px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-secondary-light to-secondary-dark rounded-lg hover:shadow-md hover:shadow-secondary-light/20 transition-all duration-300 transform active:scale-95"
              >
                Join
              </Link>
            </div>

            <div className="relative flex items-center gap-4 text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark">
              <div className="flex items-center gap-1.5 bg-background-light dark:bg-surface-dark px-2 py-1 rounded-md border border-border-light dark:border-border-dark">
                <FaUserFriends className="text-secondary-light dark:text-secondary-dark/80" />
                <span>
                  {game.players.length} / {game.maxPlayers}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-background-light dark:bg-surface-dark px-2 py-1 rounded-md border border-border-light dark:border-border-dark">
                <FaRegClock className="text-primary-light dark:text-primary-dark/80" />
                <span title="Waiting for players">Waiting</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveGamesWidget;
