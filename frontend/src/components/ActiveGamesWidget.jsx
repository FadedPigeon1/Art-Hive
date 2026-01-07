import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaGamepad, FaUserFriends, FaRegClock } from 'react-icons/fa';
import { gameAPI } from '../utils/api';

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

  if (loading) return (
    <div className="bg-white rounded-xl shadow-sm p-4 animate-pulse mb-6">
      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="space-y-3">
        {[1, 2].map(i => (
          <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );

  if (games.length === 0) return null; 

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border border-indigo-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2">
          <FaGamepad className="text-indigo-500" />
          Active Games
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full animate-pulse">
          Live
        </span>
      </div>

      <div className="space-y-3">
        {games.map((game) => (
          <div key={game._id} className="border border-gray-100 rounded-lg p-3 hover:border-indigo-200 transition bg-gray-50">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-mono font-bold text-indigo-600 text-lg tracking-wider">
                  {game.code}
                </span>
                <p className="text-xs text-gray-500 capitalize">{game.gameMode} Mode</p>
              </div>
              <Link
                to={`/game?code=${game.code}`} 
                className="px-3 py-1 text-xs font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
              >
                Join
              </Link>
            </div>
            
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <FaUserFriends />
                <span>{game.players.length}/{game.maxPlayers}</span>
              </div>
              <div className="flex items-center gap-1">
                 <FaRegClock />
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
