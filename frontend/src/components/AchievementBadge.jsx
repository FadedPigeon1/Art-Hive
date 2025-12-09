import React from "react";

const AchievementBadge = ({ achievement, size = "md" }) => {
  const sizeClasses = {
    sm: "w-12 h-12 text-xl",
    md: "w-16 h-16 text-2xl",
    lg: "w-20 h-20 text-3xl",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div
      className="group relative inline-block"
      title={achievement.description}
    >
      {/* Badge Container */}
      <div
        className={`${sizeClasses[size]} flex items-center justify-center bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg border-4 border-white dark:border-gray-800 transform transition-transform hover:scale-110 cursor-pointer`}
      >
        <span className="drop-shadow-md">{achievement.icon}</span>
      </div>

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-gray-900 dark:bg-gray-700 text-white px-3 py-2 rounded-lg shadow-xl text-center min-w-max max-w-xs">
          <p className={`font-semibold ${textSizeClasses[size]}`}>
            {achievement.name}
          </p>
          <p className="text-xs text-gray-300 mt-1">
            {achievement.description}
          </p>
          {achievement.unlockedAt && (
            <p className="text-xs text-gray-400 mt-1">
              Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
            </p>
          )}
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900 dark:border-t-gray-700"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AchievementBadge;
