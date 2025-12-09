import React from "react";

const ProgressBar = ({
  currentXP,
  xpForNextLevel,
  level,
  showLabel = true,
}) => {
  const percentage = Math.min(
    Math.floor((currentXP / xpForNextLevel) * 100),
    100
  );

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Level {level}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {currentXP} / {xpForNextLevel} XP
          </span>
        </div>
      )}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1"
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 && (
            <span className="text-[10px] font-bold text-white drop-shadow">
              {percentage}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
