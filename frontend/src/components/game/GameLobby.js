import React from "react";
import { FiCopy, FiAward } from "react-icons/fi";

// Helper to generate a consistent color from a string
const stringToColor = (str) => {
  if (!str) return "bg-gray-400";
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    "bg-red-400",
    "bg-orange-400",
    "bg-amber-400",
    "bg-green-400",
    "bg-emerald-400",
    "bg-teal-400",
    "bg-cyan-400",
    "bg-blue-400",
    "bg-indigo-400",
    "bg-violet-400",
    "bg-purple-400",
    "bg-fuchsia-400",
    "bg-pink-400",
    "bg-rose-400",
  ];
  return colors[Math.abs(hash) % colors.length];
};

const GameLobby = ({
  currentGame,
  nickname,
  copyGameCode,
  handleStartGame,
  handleLeaveRoom,
}) => {
  const isHost = nickname === currentGame?.hostId;

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

      <div className="max-w-4xl w-full relative z-10">
        {/* Header / Logo Area */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] transform -rotate-2">
            LOBBY
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.1)] overflow-hidden border-4 border-blue-800">
          {/* Game Code Section */}
          <div className="bg-yellow-400 p-6 border-b-4 border-blue-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-xl border-2 border-blue-800 shadow-[4px_4px_0_rgba(30,64,175,1)]">
                <span className="block text-xs font-bold text-blue-800 uppercase tracking-widest">
                  Room Code
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-black text-blue-800 tracking-widest">
                    {currentGame?.code}
                  </span>
                </div>
              </div>
              <button
                onClick={copyGameCode}
                className="p-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl border-b-4 border-blue-700 active:border-b-0 active:translate-y-1 transition-all"
                title="Copy Code"
              >
                <FiCopy size={24} />
              </button>
            </div>

            <div className="flex items-center gap-2 bg-blue-800/10 px-4 py-2 rounded-full">
              <span className="font-bold text-blue-900">
                {currentGame?.players?.length} / 12 Players
              </span>
            </div>
          </div>

          <div className="p-8 bg-blue-50">
            {/* Players Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
              {currentGame?.players?.map((player, index) => {
                const isMe = player.nickname === nickname;
                const isPlayerHost = player.nickname === currentGame.hostId;
                const colorClass = stringToColor(player.nickname);

                return (
                  <div
                    key={index}
                    className={`relative group ${
                      isMe ? "transform scale-105" : ""
                    }`}
                  >
                    <div
                      className={`aspect-square rounded-2xl border-4 border-blue-900 shadow-[4px_4px_0_rgba(30,64,175,0.2)] flex flex-col items-center justify-center p-4 bg-white transition-transform hover:-translate-y-1`}
                    >
                      <div
                        className={`w-16 h-16 md:w-20 md:h-20 rounded-full ${colorClass} border-4 border-black flex items-center justify-center mb-3 shadow-inner`}
                      >
                        <span className="text-2xl md:text-3xl font-black text-white uppercase">
                          {player.nickname.substring(0, 2)}
                        </span>
                      </div>
                      <span className="font-bold text-blue-900 truncate w-full text-center">
                        {player.nickname}
                      </span>

                      {isPlayerHost && (
                        <div className="absolute -top-3 -right-3 bg-yellow-400 text-blue-900 p-2 rounded-full border-2 border-blue-900 shadow-sm z-10">
                          <FiAward size={16} />
                        </div>
                      )}

                      {isMe && (
                        <div className="absolute -bottom-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full border-2 border-blue-900">
                          YOU
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Empty Slots placeholders */}
              {Array.from({
                length: Math.max(0, 4 - (currentGame?.players?.length || 0)),
              }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-2xl border-4 border-dashed border-blue-200 flex items-center justify-center"
                >
                  <span className="text-blue-200 font-bold">Waiting...</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4 max-w-md mx-auto">
              {isHost ? (
                <button
                  onClick={handleStartGame}
                  disabled={currentGame?.players?.length < 2}
                  className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-wider border-b-8 transition-all transform active:border-b-0 active:translate-y-2 ${
                    currentGame?.players?.length < 2
                      ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                      : "bg-green-500 text-white border-green-700 hover:bg-green-400 shadow-lg"
                  }`}
                >
                  {currentGame?.players?.length < 2
                    ? "Waiting for Players..."
                    : "Start Game!"}
                </button>
              ) : (
                <div className="text-center p-4 bg-blue-100 rounded-xl border-2 border-blue-200 text-blue-800 font-bold animate-pulse">
                  Waiting for host to start...
                </div>
              )}

              <button
                onClick={handleLeaveRoom}
                className="w-full py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 transition-colors"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
