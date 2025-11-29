import React from "react";
import {
  FaGamepad,
  FaUser,
  FaHashtag,
  FaPlus,
  FaSignInAlt,
} from "react-icons/fa";

const GameMenu = ({
  nickname,
  setNickname,
  gameCode,
  setGameCode,
  handleCreateGame,
  handleJoinGame,
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light/10 to-purple-500/10 dark:from-primary-dark/20 dark:to-purple-900/20 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-background-light dark:bg-background-dark rounded-2xl shadow-xl p-8 border border-border-light dark:border-border-dark backdrop-blur-sm">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-primary-light/10 dark:bg-primary-dark/20 rounded-full">
              <FaGamepad className="w-12 h-12 text-primary-light dark:text-primary-dark" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center mb-2 bg-gradient-to-r from-primary-light to-purple-600 dark:from-primary-dark dark:to-purple-400 bg-clip-text text-transparent">
            ArtHive Game
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-8 text-center">
            Draw, guess, and unleash your creativity!
          </p>

          <div className="space-y-6">
            {/* Nickname Input */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaUser className="text-text-secondary-light dark:text-text-secondary-dark group-focus-within:text-primary-light dark:group-focus-within:text-primary-dark transition-colors" />
              </div>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Choose your nickname"
                className="w-full pl-10 pr-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-xl border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition-all"
                maxLength={20}
              />
            </div>

            {/* Create Game Button */}
            <button
              onClick={handleCreateGame}
              className="w-full py-3.5 bg-gradient-to-r from-primary-light to-primary-dark hover:from-primary-dark hover:to-primary-light text-white rounded-xl font-bold shadow-lg shadow-primary-light/30 hover:shadow-primary-light/50 transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
            >
              <FaPlus />
              Create New Game
            </button>

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light dark:border-border-dark"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark font-medium">
                  OR JOIN EXISTING
                </span>
              </div>
            </div>

            {/* Join Game Section */}
            <div className="space-y-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaHashtag className="text-text-secondary-light dark:text-text-secondary-dark group-focus-within:text-primary-light dark:group-focus-within:text-primary-dark transition-colors" />
                </div>
                <input
                  type="text"
                  value={gameCode}
                  onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                  placeholder="Enter Game Code"
                  className="w-full pl-10 pr-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-xl border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition-all uppercase tracking-wider font-medium"
                  maxLength={6}
                />
              </div>

              <button
                onClick={handleJoinGame}
                className="w-full py-3.5 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border-2 border-border-light dark:border-border-dark rounded-xl font-bold hover:border-primary-light dark:hover:border-primary-dark hover:text-primary-light dark:hover:text-primary-dark transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaSignInAlt />
                Join Game
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-text-secondary-light dark:text-text-secondary-dark">
          Inspired by classic drawing games
        </p>
      </div>
    </div>
  );
};

export default GameMenu;
