import React from "react";
import { FiCopy } from "react-icons/fi";

const GameLobby = ({
  currentGame,
  nickname,
  copyGameCode,
  handleStartGame,
  handleLeaveRoom,
}) => {
  const isHost = nickname === currentGame?.hostId;

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4 text-center">
            Game Lobby
          </h1>

          <div className="flex items-center justify-center space-x-3 mb-6">
            <span className="text-xl text-text-secondary-light dark:text-text-secondary-dark">
              Game Code:
            </span>
            <span className="text-3xl font-bold text-primary-light">
              {currentGame?.code}
            </span>
            <button
              onClick={copyGameCode}
              className="p-2 hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors"
            >
              <FiCopy size={20} />
            </button>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
              Players ({currentGame?.players?.length || 0})
            </h2>
            <div className="space-y-2">
              {currentGame?.players?.map((player, index) => (
                <div
                  key={index}
                  className="px-4 py-3 bg-surface-light dark:bg-surface-dark rounded-lg"
                >
                  <p className="text-text-primary-light dark:text-text-primary-dark">
                    {player.nickname}
                    {player.nickname === currentGame.hostId && (
                      <span className="ml-2 text-xs bg-primary-light text-white px-2 py-1 rounded">
                        HOST
                      </span>
                    )}
                    {player.nickname === nickname && (
                      <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                        YOU
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Your nickname: <span className="font-semibold">{nickname}</span>
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              Host: <span className="font-semibold">{currentGame?.hostId}</span>
            </p>
            <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
              You are host:{" "}
              <span className="font-semibold">{isHost ? "YES" : "NO"}</span>
            </p>
          </div>

          {isHost ? (
            <div className="space-y-3">
              <button
                onClick={handleStartGame}
                disabled={currentGame?.players?.length < 2}
                className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={
                  currentGame?.players?.length < 2
                    ? `Need at least 2 players. Current: ${currentGame?.players?.length}`
                    : "Click to start the game"
                }
              >
                {currentGame?.players?.length < 2
                  ? `Waiting for players... (${currentGame?.players?.length}/2)`
                  : "Start Game"}
              </button>
              {currentGame?.status && (
                <p className="text-xs text-center text-text-secondary-light dark:text-text-secondary-dark">
                  Game status: {currentGame.status}
                </p>
              )}
              <button
                onClick={handleLeaveRoom}
                className="w-full py-2 text-red-500 hover:text-red-600 border border-red-500 hover:border-red-600 rounded-lg font-medium transition-colors"
              >
                Leave Room
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-text-secondary-light dark:text-text-secondary-dark">
                Waiting for host to start the game...
              </p>
              <button
                onClick={handleLeaveRoom}
                className="w-full py-2 text-red-500 hover:text-red-600 border border-red-500 hover:border-red-600 rounded-lg font-medium transition-colors"
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
