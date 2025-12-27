import React from "react";
import {
  FaGamepad,
  FaUser,
  FaHashtag,
  FaPlus,
  FaSignInAlt,
  FaUsers,
  FaClock,
} from "react-icons/fa";

const GameMenu = ({
  nickname,
  setNickname,
  gameCode,
  setGameCode,
  maxPlayers,
  setMaxPlayers,
  gameMode,
  setGameMode,
  handleCreateGame,
  handleJoinGame,
}) => {
  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 font-sans">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#fff 2px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      ></div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] transform -rotate-2">
            ARTHIVE
          </h1>
          <p className="text-blue-100 font-bold text-xl mt-2 transform rotate-1">
            Draw, Guess, Win!
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.1)] overflow-hidden border-4 border-blue-800 p-6">
          {/* Nickname Section */}
          <div className="mb-6">
            <label className="block text-blue-900 font-black uppercase tracking-wide mb-2 text-sm">
              Your Nickname
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-blue-400" />
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter nickname..."
                className="w-full pl-10 pr-4 py-3 bg-blue-50 text-blue-900 rounded-xl border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-bold placeholder-blue-300 transition-all"
                maxLength={20}
              />
            </div>
          </div>

          {/* Create Game Section */}
          <div className="bg-yellow-50 rounded-xl border-2 border-yellow-200 p-4 mb-6">
            <h3 className="text-yellow-700 font-black uppercase tracking-wide mb-4 flex items-center gap-2">
              <FaPlus /> Create Room
            </h3>

            <div className="grid grid-cols-2 gap-3 mb-4">
              {/* Max Players */}
              <div>
                <label className="block text-yellow-800 font-bold text-xs uppercase mb-1">
                  Players
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaUsers className="text-yellow-500 text-xs" />
                  </div>
                  <input
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    min={2}
                    max={10}
                    className="w-full pl-7 pr-2 py-2 bg-white text-blue-900 rounded-lg border-2 border-yellow-300 focus:outline-none focus:border-yellow-500 font-bold"
                  />
                </div>
              </div>
              {/* Game Mode */}
              <div>
                <label className="block text-yellow-800 font-bold text-xs uppercase mb-1">
                  Mode
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    <FaClock className="text-yellow-500 text-xs" />
                  </div>
                  <select
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value)}
                    className="w-full pl-7 pr-2 py-2 bg-white text-blue-900 rounded-lg border-2 border-yellow-300 focus:outline-none focus:border-yellow-500 font-bold appearance-none"
                  >
                    <option value="classic">Classic</option>
                    <option value="speed">Speed</option>
                    <option value="relaxed">Relaxed</option>
                    <option value="art-jam">Art Jam (Live)</option>
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateGame}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-300 text-blue-900 rounded-xl font-black uppercase tracking-wide border-b-4 border-yellow-600 active:border-b-0 active:translate-y-1 transition-all shadow-sm"
            >
              Create Game
            </button>
          </div>

          {/* Join Game Section */}
          <div className="bg-blue-50 rounded-xl border-2 border-blue-200 p-4">
            <h3 className="text-blue-700 font-black uppercase tracking-wide mb-4 flex items-center gap-2">
              <FaSignInAlt /> Join Room
            </h3>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaHashtag className="text-blue-400" />
                </div>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="CODE"
                  className="w-full pl-10 pr-4 py-3 bg-white text-blue-900 rounded-xl border-2 border-blue-200 focus:outline-none focus:border-blue-500 font-black uppercase placeholder-blue-300"
                  maxLength={6}
                />
              </div>
              <button
                onClick={handleJoinGame}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-black uppercase tracking-wide border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all shadow-sm"
              >
                Join
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-blue-200 font-medium opacity-80">
          Inspired by classic drawing games
        </p>
      </div>
    </div>
  );
};

export default GameMenu;
