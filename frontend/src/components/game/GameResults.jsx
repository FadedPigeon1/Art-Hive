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
                    Story {currentRevealChain + 1} of {chains.length} • Step{" "}
                    {currentRevealStep + 1} of{" "}
                    {(chains[currentRevealChain]?.entries?.length || 0) + 1}
                  </p>
                </div>
              </div>
            )}

            {/* REVEAL STAGE (Gartic Phone Style) */}
            {isRevealing && chains[currentRevealChain] && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl border-4 border-blue-800 shadow-2xl overflow-hidden">
                  {/* Chain Header */}
                  <div className="bg-blue-600 p-4 text-center border-b-4 border-blue-800">
                    <h2 className="text-2xl font-black text-white uppercase tracking-wider">
                      Story by {chains[currentRevealChain].originalPlayer}
                    </h2>
                  </div>

                  <div className="p-8 min-h-[400px] flex flex-col items-center justify-center bg-slate-100 relative">
                    {/* Step 0: Original Prompt */}
                    {currentRevealStep === 0 && (
                      <div className="animate-in zoom-in duration-500 flex flex-col items-center w-full">
                        <div className="bg-yellow-400 text-blue-900 p-8 rounded-3xl rounded-bl-none border-4 border-blue-900 shadow-[8px_8px_0_rgba(30,58,138,1)] max-w-lg w-full text-center relative mb-8">
                          <p className="text-3xl font-black uppercase leading-tight">
                            "{chains[currentRevealChain].originalPrompt}"
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">
                            {chains[currentRevealChain].originalPlayer
                              .substring(0, 2)
                              .toUpperCase()}
                          </div>
                          <span className="font-bold text-blue-900 text-lg">
                            {chains[currentRevealChain].originalPlayer} wrote
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Steps > 0: Show Context + Result */}
                    {currentRevealStep > 0 && (
                      <div className="w-full flex flex-col items-center gap-8">
                        {/* CONTEXT (Previous Step) - Smaller/Faded */}
                        <div className="opacity-60 scale-75 origin-bottom transition-all duration-500 blur-[1px] hover:blur-0 hover:opacity-100 hover:scale-90 cursor-pointer">
                          {currentRevealStep === 1 ? (
                            // Context was Original Prompt
                            <div className="bg-yellow-200 text-blue-900 p-4 rounded-2xl border-2 border-blue-900 text-center max-w-md">
                              <p className="font-bold">
                                "{chains[currentRevealChain].originalPrompt}"
                              </p>
                            </div>
                          ) : (
                            // Context was previous entry
                            (() => {
                              const prevEntry =
                                chains[currentRevealChain].entries[
                                  currentRevealStep - 2
                                ];
                              return prevEntry.type === "prompt" ? (
                                <div className="bg-yellow-200 text-blue-900 p-4 rounded-2xl border-2 border-blue-900 text-center max-w-md">
                                  <p className="font-bold">
                                    "{prevEntry.data}"
                                  </p>
                                </div>
                              ) : (
                                <img
                                  src={prevEntry.data}
                                  alt="Previous"
                                  className="w-48 h-auto rounded-lg border-2 border-blue-900 bg-white"
                                />
                              );
                            })()
                          )}
                        </div>

                        {/* ARROW */}
                        <div className="text-blue-400 text-4xl animate-bounce">
                          ⬇
                        </div>

                        {/* CURRENT RESULT - Big & Animated */}
                        <div className="animate-in slide-in-from-bottom-10 fade-in duration-500 w-full flex flex-col items-center">
                          {(() => {
                            const entry =
                              chains[currentRevealChain].entries[
                                currentRevealStep - 1
                              ];
                            return (
                              <>
                                {entry.type === "prompt" ? (
                                  // Text Guess Bubble
                                  <div className="bg-white text-blue-900 p-8 rounded-3xl rounded-tr-none border-4 border-blue-900 shadow-[8px_8px_0_rgba(30,58,138,1)] max-w-lg w-full text-center relative mb-6">
                                    <p className="text-3xl font-black uppercase leading-tight">
                                      "{entry.data}"
                                    </p>
                                  </div>
                                ) : (
                                  // Drawing Frame
                                  <div className="bg-white p-3 rounded-xl border-4 border-blue-900 shadow-[8px_8px_0_rgba(30,58,138,1)] rotate-1 hover:rotate-0 transition-transform duration-300 mb-6">
                                    <img
                                      src={entry.data}
                                      alt="Drawing"
                                      className="max-w-full max-h-[400px] rounded-lg bg-white"
                                    />
                                  </div>
                                )}

                                {/* Player Info */}
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full bg-blue-900 flex items-center justify-center text-white font-bold border-2 border-white shadow-lg">
                                    {entry.playerNickname
                                      .substring(0, 2)
                                      .toUpperCase()}
                                  </div>
                                  <span className="font-bold text-blue-900 text-lg">
                                    {entry.playerNickname}{" "}
                                    {entry.type === "prompt"
                                      ? "guessed"
                                      : "drew"}
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* FULL SUMMARY LIST (Only when not revealing) */}
            {!isRevealing &&
              chains.map((chain, chainIndex) => {
                return (
                  <div
                    key={chain.chainId}
                    className="mb-12 bg-white rounded-3xl border-4 border-blue-200 overflow-hidden opacity-100"
                  >
                    {/* Chain Header */}
                    <div className="bg-blue-100 p-4 border-b-4 border-blue-200 flex items-center justify-between">
                      <h2 className="text-2xl font-black text-blue-900 uppercase">
                        Chain {chainIndex + 1}
                      </h2>
                      <span className="bg-blue-200 text-blue-800 px-3 py-1 rounded-full font-bold text-sm">
                        Started by {chain.originalPlayer}
                      </span>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Original Prompt */}
                      <div className="bg-yellow-50 rounded-2xl border-4 border-yellow-200 p-6 text-center relative">
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-yellow-300 text-yellow-900 text-xs font-black px-3 py-1 rounded-full border border-yellow-500 uppercase tracking-wide">
                          Original Prompt
                        </div>
                        <p className="text-2xl md:text-3xl font-black text-blue-900 italic mt-2">
                          "{chain.originalPrompt}"
                        </p>
                      </div>

                      {/* Chain Entries */}
                      {chain.entries.map((entry, entryIndex) => {
                        return (
                          <div
                            key={entryIndex}
                            className="rounded-2xl border-4 border-gray-200 overflow-hidden bg-gray-50"
                          >
                            <div className="p-3 border-b-2 border-gray-200 bg-gray-100 flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center font-bold text-white text-xs">
                                  {entry.playerNickname
                                    .substring(0, 2)
                                    .toUpperCase()}
                                </div>
                                <span className="font-bold text-gray-600">
                                  {entry.playerNickname}
                                </span>
                              </div>
                              <span className="text-xs font-bold px-2 py-1 rounded uppercase bg-gray-200 text-gray-600">
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
                                    onClick={() =>
                                      handleRepostToFeed(entry.data)
                                    }
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
