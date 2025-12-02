import React from "react";
import {
  FiUpload,
  FiPlay,
  FiSkipForward,
  FiRefreshCw,
  FiHome,
} from "react-icons/fi";

const GameResults = ({
  currentGame,
  nickname,
  chains,
  isRevealing,
  currentRevealChain,
  currentRevealStep,
  socket,
  setIsRevealing,
  setCurrentRevealChain,
  setCurrentRevealStep,
  handleRevealNext,
  handleRevealReset,
  handleRepostToFeed,
  setGameState,
  setCurrentGame,
  setDrawings,
  setChains,
  setCurrentRound,
  setCurrentTask,
  setHasSubmitted,
}) => {
  const isHost = nickname === currentGame?.hostId;
  const showStartButton = !isRevealing && isHost;

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

      <div className="max-w-6xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] transform -rotate-2">
            RESULTS
          </h1>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.1)] overflow-hidden border-4 border-blue-800">
          {/* Status Bar */}
          <div className="bg-yellow-400 p-4 border-b-4 border-blue-800 text-center">
            <p className="text-blue-900 font-bold text-lg">
              {isHost &&
                !isRevealing &&
                "Click 'Start Reveal' to begin the show!"}
              {isHost &&
                isRevealing &&
                "Click 'Next' to reveal each masterpiece!"}
              {!isHost &&
                !isRevealing &&
                "Waiting for host to start the show..."}
              {!isHost && isRevealing && "Watch the hilarity unfold!"}
            </p>
          </div>

          <div className="p-6 md:p-8 bg-blue-50 min-h-[400px]">
            {/* Host Controls */}
            {isHost && (
              <div className="mb-8 flex justify-center gap-4 flex-wrap">
                {showStartButton ? (
                  <button
                    onClick={() => {
                      setIsRevealing(true);
                      setCurrentRevealChain(0);
                      setCurrentRevealStep(0);
                      if (socket) {
                        socket.emit("reveal-step", {
                          code: currentGame.code,
                          chainIndex: 0,
                          stepIndex: 0,
                        });
                      }
                    }}
                    className="px-8 py-4 bg-green-500 text-white rounded-2xl font-black text-xl uppercase tracking-wider border-b-8 border-green-700 hover:bg-green-400 active:border-b-0 active:translate-y-2 transition-all shadow-lg flex items-center gap-2"
                  >
                    <FiPlay /> Start Reveal
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleRevealNext}
                      disabled={
                        currentRevealChain >= chains.length - 1 &&
                        currentRevealStep >=
                          (chains[currentRevealChain]?.entries?.length || 0)
                      }
                      className="px-6 py-3 bg-blue-500 text-white rounded-xl font-bold border-b-4 border-blue-700 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FiSkipForward /> Next
                    </button>
                    <button
                      onClick={handleRevealReset}
                      className="px-6 py-3 bg-gray-500 text-white rounded-xl font-bold border-b-4 border-gray-700 hover:bg-gray-400 active:border-b-0 active:translate-y-1 transition-all flex items-center gap-2"
                    >
                      <FiRefreshCw /> Reset
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Progress Indicator */}
            {isRevealing && (
              <div className="mb-8 flex justify-center">
                <div className="bg-white px-6 py-2 rounded-full border-2 border-blue-200 shadow-sm">
                  <p className="font-bold text-blue-800">
                    Chain {currentRevealChain + 1} of {chains.length} • Step{" "}
                    {currentRevealStep + 1} of{" "}
                    {(chains[currentRevealChain]?.entries?.length || 0) + 1}
                  </p>
                </div>
              </div>
            )}

            {/* Display chains with reveal logic */}
            {chains.map((chain, chainIndex) => {
              const isChainVisible = isRevealing
                ? chainIndex <= currentRevealChain
                : true;
              const showAllSteps =
                !isRevealing || chainIndex < currentRevealChain;

              if (!isChainVisible) return null;

              return (
                <div
                  key={chain.chainId}
                  className={`mb-12 bg-white rounded-3xl border-4 overflow-hidden transition-all duration-500 ${
                    isRevealing && chainIndex === currentRevealChain
                      ? "border-blue-600 shadow-xl scale-100 ring-4 ring-blue-200"
                      : "border-blue-200 opacity-60 scale-95"
                  }`}
                >
                  {/* Chain Header */}
                  {(showAllSteps || currentRevealStep >= 0) && (
                    <div className="bg-blue-100 p-4 border-b-4 border-blue-200 flex items-center justify-between">
                      <h2 className="text-2xl font-black text-blue-900 uppercase">
                        Chain {chainIndex + 1}
                      </h2>
                      <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-bold text-sm">
                        Started by {chain.originalPlayer}
                      </span>
                    </div>
                  )}

                  <div className="p-6 space-y-6">
                    {/* Original Prompt */}
                    {(showAllSteps || currentRevealStep >= 0) && (
                      <div className="bg-yellow-50 rounded-2xl border-4 border-yellow-200 p-6 text-center relative">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-300 text-yellow-900 text-xs font-black px-3 py-1 rounded-full border border-yellow-500 uppercase tracking-wide">
                          Original Prompt
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-blue-900 italic mt-2">
                          "{chain.originalPrompt}"
                        </p>
                      </div>
                    )}

                    {/* Chain Entries */}
                    {chain.entries.map((entry, entryIndex) => {
                      const shouldShow =
                        showAllSteps ||
                        (chainIndex === currentRevealChain &&
                          entryIndex < currentRevealStep);

                      if (!shouldShow) return null;

                      const isCurrentReveal =
                        isRevealing &&
                        chainIndex === currentRevealChain &&
                        entryIndex === currentRevealStep - 1;

                      return (
                        <div
                          key={entryIndex}
                          className={`rounded-2xl border-4 overflow-hidden transition-all duration-500 ${
                            isCurrentReveal
                              ? "bg-white border-green-400 shadow-lg transform scale-105 z-10"
                              : "bg-gray-50 border-gray-200"
                          }`}
                        >
                          <div
                            className={`p-3 border-b-2 flex justify-between items-center ${
                              isCurrentReveal
                                ? "bg-green-50 border-green-200"
                                : "bg-gray-100 border-gray-200"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                                  isCurrentReveal
                                    ? "bg-green-500"
                                    : "bg-gray-400"
                                }`}
                              >
                                {entry.playerNickname
                                  .substring(0, 2)
                                  .toUpperCase()}
                              </div>
                              <span
                                className={`font-bold ${
                                  isCurrentReveal
                                    ? "text-green-800"
                                    : "text-gray-600"
                                }`}
                              >
                                {entry.playerNickname}
                              </span>
                            </div>
                            <span
                              className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                                isCurrentReveal
                                  ? "bg-green-200 text-green-800"
                                  : "bg-gray-200 text-gray-600"
                              }`}
                            >
                              {entry.type === "prompt" ? "Guessed" : "Drew"}
                            </span>
                          </div>

                          <div className="p-6 text-center">
                            {entry.type === "prompt" ? (
                              <p className="text-2xl font-bold text-blue-900 italic">
                                "{entry.data}"
                              </p>
                            ) : (
                              <div className="relative group">
                                <img
                                  src={entry.data}
                                  alt={`Drawing by ${entry.playerNickname}`}
                                  className="max-w-md mx-auto rounded-xl border-2 border-gray-200 shadow-sm"
                                />
                                <button
                                  onClick={() => handleRepostToFeed(entry.data)}
                                  className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity px-4 py-2 bg-blue-500 text-white rounded-lg font-bold shadow-lg hover:bg-blue-400 flex items-center gap-2 transform translate-y-2 group-hover:translate-y-0 duration-200"
                                >
                                  <FiUpload /> Post
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-12 pt-8 border-t-4 border-blue-200">
              <button
                onClick={() => {
                  setGameState("menu");
                  setCurrentGame(null);
                  setDrawings([]);
                  setChains([]);
                  setCurrentRound(0);
                  setCurrentTask(null);
                  setHasSubmitted(false);
                  setCurrentRevealChain(0);
                  setCurrentRevealStep(0);
                  setIsRevealing(false);
                }}
                className="w-full py-4 bg-white text-blue-500 border-4 border-blue-200 rounded-2xl font-black text-xl uppercase tracking-wider hover:bg-blue-50 hover:border-blue-300 transition-all flex items-center justify-center gap-2"
              >
                <FiHome /> Back to Menu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
