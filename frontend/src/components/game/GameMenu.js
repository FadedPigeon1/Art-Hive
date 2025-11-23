import React from "react";

const GameMenu = ({
  nickname,
  setNickname,
  gameCode,
  setGameCode,
  handleCreateGame,
  handleJoinGame,
}) => {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 text-center">
            ArtHive Game
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6 text-center">
            Draw, guess, and have fun! Inspired by Gartic Phone.
          </p>

          <div className="space-y-4 mb-6">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
              maxLength={20}
            />
          </div>

          <div className="space-y-3">
            <button
              onClick={handleCreateGame}
              className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Create New Game
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-light dark:border-border-dark"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark">
                  OR
                </span>
              </div>
            </div>

            <input
              type="text"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              placeholder="Enter game code"
              className="w-full px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light uppercase"
              maxLength={6}
            />

            <button
              onClick={handleJoinGame}
              className="w-full py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-lg font-medium hover:bg-border-light dark:hover:bg-border-dark transition-colors"
            >
              Join Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameMenu;
