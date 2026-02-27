import React, { useState, useEffect } from "react";
import GameDrawCanvas from "./GameDrawCanvas";
import { FiClock } from "react-icons/fi";

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
  handleLeaveGame,
}) => {
  const isPromptTask = currentTask?.taskType === "prompt";
  const isDrawingTask = currentTask?.taskType === "drawing";

  const drawSeconds = currentGame?.drawTime || 90;
  const guessSeconds = Math.max(30, Math.round(drawSeconds / 2));

  // Timer is only used for prompt tasks; drawing canvas owns its own timer
  const [timeLeft, setTimeLeft] = useState(guessSeconds);

  // Reset timer when round or task type changes (prompt only)
  useEffect(() => {
    if (isPromptTask) {
      setTimeLeft(Math.max(30, Math.round((currentGame?.drawTime || 90) / 2)));
    }
  }, [currentRound, isPromptTask, currentGame?.drawTime]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, "0")}`;
    }
    return `${secs}s`;
  };

  // Countdown — only for prompt tasks
  useEffect(() => {
    if (hasSubmitted || isDrawingTask) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTask(null, true); // Auto-submit when time is up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasSubmitted, isDrawingTask, handleSubmitTask]);

  // Drawing task — delegate entirely to GameDrawCanvas (it owns its timer & waiting screen)
  if (isDrawingTask) {
    return (
      <GameDrawCanvas
        prompt={currentTask?.previousEntry?.data || ""}
        drawSeconds={drawSeconds}
        currentRound={currentRound}
        totalRounds={currentGame?.totalRounds}
        onSubmit={(blob) => handleSubmitTask(blob)}
        onLeave={handleLeaveGame}
        hasSubmitted={hasSubmitted}
        submittedCount={submittedCount}
        totalPlayers={totalPlayers}
      />
    );
  }

  // Prompt task
  const isUrgent = timeLeft <= 15;

  return (
    <div className="min-h-screen bg-blue-600 flex items-center justify-center p-4 font-sans">
      {/* Background Pattern */}
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(#fff 2px, transparent 2px)",
          backgroundSize: "30px 30px",
        }}
      />

      <div className="max-w-4xl w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8 relative">
          <button
            onClick={handleLeaveGame}
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md border-b-4 border-red-700 active:border-b-0 active:translate-y-1 transition-all"
          >
            Leave
          </button>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-wider drop-shadow-[0_4px_0_rgba(0,0,0,0.2)] transform -rotate-1">
            ROUND {currentRound}
          </h1>
          <div className="flex justify-center gap-4 mt-2">
            <div className="inline-block bg-yellow-400 text-blue-900 font-bold px-4 py-1 rounded-full border-2 border-blue-900 shadow-sm transform rotate-1">
              {currentRound} / {currentGame?.totalRounds}
            </div>
            <div
              className={`inline-flex items-center gap-2 font-bold px-4 py-1 rounded-full border-2 shadow-sm transform -rotate-1 transition-colors ${
                isUrgent
                  ? "bg-red-500 text-white border-red-700 animate-pulse"
                  : "bg-white text-blue-900 border-blue-200"
              }`}
            >
              <FiClock /> {formatTime(timeLeft)}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-[0_8px_0_rgba(0,0,0,0.1)] overflow-hidden border-4 border-blue-800">
          {/* Task Header */}
          <div className="bg-blue-50 p-6 border-b-4 border-blue-800 text-center">
            <p className="text-xl font-bold text-blue-800">
              {isPromptTask &&
                (currentRound === 1
                  ? "Write something fun for the next player to draw! 🎨"
                  : "What does this drawing look like to you? 🤔")}
            </p>
          </div>

          <div className="p-6 md:p-8">
            {/* Show previous drawing if not first round */}
            {currentTask?.previousEntry && (
              <div className="mb-8">
                <div className="bg-yellow-100 rounded-2xl border-4 border-yellow-400 p-6 relative">
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-yellow-900 font-black px-4 py-1 rounded-full border-2 border-yellow-600 text-sm uppercase tracking-wide">
                    {currentTask.previousEntry.type === "prompt"
                      ? "Draw This:"
                      : "Describe This:"}
                  </div>

                  {currentTask.previousEntry.type === "prompt" ? (
                    <p className="text-2xl md:text-3xl font-black text-center text-blue-900 italic mt-2">
                      "{currentTask.previousEntry.data}"
                    </p>
                  ) : (
                    <div className="bg-white rounded-xl border-2 border-blue-900 overflow-hidden shadow-sm mx-auto max-w-md">
                      <img
                        src={currentTask.previousEntry.data}
                        alt="Previous drawing"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Text input */}
            {isPromptTask && (
              <div className="mb-6">
                <div className="relative">
                  <textarea
                    value={promptText}
                    onChange={(e) => setPromptText(e.target.value)}
                    placeholder={
                      currentRound === 1
                        ? "E.g., 'A cat playing piano', 'Sunset over mountains'..."
                        : "What do you think the drawing shows? Describe it..."
                    }
                    className="w-full px-6 py-4 bg-white text-blue-900 text-xl font-bold rounded-2xl border-4 border-blue-200 focus:border-blue-500 focus:outline-none focus:ring-0 resize-none placeholder-blue-300"
                    rows={3}
                    maxLength={100}
                    disabled={hasSubmitted}
                  />
                  <div className="absolute bottom-4 right-4 text-xs font-bold text-blue-300 bg-white px-2 py-1 rounded-md">
                    {promptText.length}/100
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={() => handleSubmitTask()}
              disabled={hasSubmitted || (isPromptTask && !promptText.trim())}
              className={`w-full py-4 rounded-2xl font-black text-xl uppercase tracking-wider border-b-8 transition-all transform active:border-b-0 active:translate-y-2 ${
                hasSubmitted || (isPromptTask && !promptText.trim())
                  ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed"
                  : "bg-green-500 text-white border-green-700 hover:bg-green-400 shadow-lg"
              }`}
            >
              {hasSubmitted ? "Waiting for others..." : "Submit!"}
            </button>

            {/* Submission Counter */}
            {hasSubmitted && totalPlayers > 0 && (
              <div className="mt-6 flex justify-center">
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-blue-50 rounded-full border-2 border-blue-200">
                  <div className="flex space-x-1">
                    {[...Array(totalPlayers)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full border border-blue-900 ${
                          i < submittedCount ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-blue-800 text-sm">
                    {submittedCount}/{totalPlayers} Ready
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameTask;
