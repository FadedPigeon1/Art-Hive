import React from "react";
import { FiUpload } from "react-icons/fi";

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
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
          <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 text-center">
            Game Results!
          </h1>
          <p className="text-center text-text-secondary-light dark:text-text-secondary-dark mb-8">
            {isHost && !isRevealing && "Click 'Start Reveal' to begin!"}
            {isHost && isRevealing && "Click 'Next' to reveal each step!"}
            {!isHost && !isRevealing && "Waiting for host to start reveal..."}
            {!isHost && isRevealing && "Watch as the host reveals each step!"}
          </p>

          {/* Host Controls */}
          {isHost && (
            <div className="mb-6 flex justify-center space-x-4">
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
                  className="px-8 py-4 bg-green-600 text-white rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
                >
                  🎬 Start Reveal
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
                    className="px-6 py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ➡️ Next
                  </button>
                  <button
                    onClick={handleRevealReset}
                    className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    🔄 Reset
                  </button>
                </>
              )}
            </div>
          )}

          {/* Progress Indicator */}
          {isRevealing && (
            <div className="mb-6 flex justify-center">
              <div className="bg-surface-light dark:bg-surface-dark px-4 py-2 rounded-lg border border-border-light dark:border-border-dark">
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Chain {currentRevealChain + 1} of {chains.length} - Step{" "}
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
                className={`mb-8 p-6 bg-surface-light dark:bg-surface-dark rounded-lg border-2 ${
                  isRevealing && chainIndex === currentRevealChain
                    ? "border-primary-light shadow-lg"
                    : "border-border-light dark:border-border-dark"
                }`}
              >
                {/* Original Prompt - Show first */}
                {(showAllSteps || currentRevealStep >= 0) && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
                      Chain {chainIndex + 1}
                    </h2>
                    <div className="p-4 bg-blue-900/20 border-2 border-blue-500 rounded-lg">
                      <p className="text-xs text-blue-400 mb-1">
                        Original Prompt by {chain.originalPlayer}:
                      </p>
                      <p className="text-xl text-text-primary-light dark:text-text-primary-dark font-semibold italic">
                        "{chain.originalPrompt}"
                      </p>
                    </div>
                  </div>
                )}

                {/* Chain Entries */}
                <div className="space-y-4">
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
                        className={`p-4 rounded-lg transition-all duration-500 ${
                          isCurrentReveal
                            ? "bg-yellow-900/30 border-2 border-yellow-500 scale-105"
                            : "bg-background-light dark:bg-background-dark border border-border-light dark:border-border-dark"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                            Round {entry.round} - {entry.playerNickname}
                          </span>
                          <span className="text-xs px-2 py-1 bg-primary-light text-white rounded">
                            {entry.type === "prompt" ? "Wrote" : "Drew"}
                          </span>
                        </div>

                        {entry.type === "prompt" ? (
                          <p className="text-lg text-text-primary-light dark:text-text-primary-dark italic">
                            "{entry.data}"
                          </p>
                        ) : (
                          <div className="relative">
                            <img
                              src={entry.data}
                              alt={`Drawing by ${entry.playerNickname}`}
                              className="max-w-md mx-auto rounded-lg border border-border-light dark:border-border-dark"
                            />
                            <button
                              onClick={() => handleRepostToFeed(entry.data)}
                              className="mt-2 flex items-center space-x-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors"
                            >
                              <FiUpload />
                              <span>Post to Feed</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

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
            className="w-full py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-lg font-medium hover:bg-border-light dark:hover:bg-border-dark transition-colors"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
