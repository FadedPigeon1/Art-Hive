import React from "react";
import { useNavigate } from "react-router-dom";

const GameTask = ({
  currentTask,
  currentRound,
  currentGame,
  nickname,
  promptText,
  setPromptText,
  hasSubmitted,
  handleSubmitTask,
  submittedCount,
  totalPlayers,
}) => {
  const navigate = useNavigate();
  const isPromptTask = currentTask?.taskType === "prompt";
  const isDrawingTask = currentTask?.taskType === "drawing";

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-6 border border-border-light dark:border-border-dark">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Round {currentRound} of {currentGame?.totalRounds}
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark">
              {isPromptTask && "Write a prompt for the next player to draw"}
              {isDrawingTask && "Draw what you see above!"}
            </p>
          </div>

          {/* Show previous entry if not first round */}
          {currentTask?.previousEntry && (
            <div className="mb-6 p-4 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
              <h3 className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark mb-2">
                {currentTask.previousEntry.type === "prompt"
                  ? "Previous Prompt:"
                  : "Previous Drawing:"}
              </h3>
              {currentTask.previousEntry.type === "prompt" ? (
                <p className="text-lg text-text-primary-light dark:text-text-primary-dark italic">
                  "{currentTask.previousEntry.data}"
                </p>
              ) : (
                <img
                  src={currentTask.previousEntry.data}
                  alt="Previous drawing"
                  className="max-w-md mx-auto rounded-lg border border-border-light dark:border-border-dark"
                />
              )}
            </div>
          )}

          {/* Task Input Area */}
          {isPromptTask ? (
            <div className="mb-4">
              <textarea
                value={promptText}
                onChange={(e) => setPromptText(e.target.value)}
                placeholder={
                  currentRound === 1
                    ? "E.g., 'A cat playing piano', 'Sunset over mountains'..."
                    : "What do you think the drawing shows? Describe it..."
                }
                className="w-full px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light resize-none"
                rows={4}
                maxLength={100}
                disabled={hasSubmitted}
              />
            </div>
          ) : isDrawingTask ? (
            <>
              {/* Use Sketchbook Pro Button */}
              <div className="mb-4 text-center">
                <button
                  onClick={() => {
                    const promptToShow = currentTask?.previousEntry?.data || "";
                    navigate(
                      `/sketchbook?gameMode=true&gameCode=${
                        currentGame.code
                      }&chainId=${
                        currentTask.chainId
                      }&round=${currentRound}&prompt=${encodeURIComponent(
                        promptToShow
                      )}&nickname=${encodeURIComponent(nickname)}`
                    );
                  }}
                  disabled={hasSubmitted}
                  className="px-6 py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Open Sketchbook Pro to Draw
                </button>
                <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-2">
                  Use our advanced drawing tools to create your artwork
                </p>
              </div>
            </>
          ) : null}

          {/* Submit Button */}
          <button
            onClick={handleSubmitTask}
            disabled={hasSubmitted || (isPromptTask && !promptText.trim())}
            className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {hasSubmitted ? "Waiting for other players..." : "Submit"}
          </button>

          {/* Submission Counter */}
          {hasSubmitted && totalPlayers > 0 && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark">
                <div className="flex space-x-1">
                  {[...Array(totalPlayers)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < submittedCount
                          ? "bg-green-500"
                          : "bg-gray-300 dark:bg-gray-600"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  {submittedCount}/{totalPlayers} submitted
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameTask;
