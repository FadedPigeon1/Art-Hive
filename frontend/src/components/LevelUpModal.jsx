import React, { useEffect, useState } from "react";

const LevelUpModal = ({ isOpen, onClose, newLevel, newAchievements = [] }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShow(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full p-8 text-center transform transition-all duration-300 ${
          show ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Celebration Animation */}
        <div className="relative mb-6">
          <div className="text-8xl animate-bounce">🎉</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-50 animate-pulse"></div>
          </div>
        </div>

        {/* Level Up Message */}
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Level Up!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          You've reached{" "}
          <span className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
            Level {newLevel}
          </span>
        </p>

        {/* New Achievements */}
        {newAchievements.length > 0 && (
          <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
              🏆 New Achievements Unlocked!
            </h3>
            <div className="space-y-2">
              {newAchievements.map((achievement, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-2 bg-white dark:bg-gray-600 rounded-lg"
                >
                  <span className="text-2xl">{achievement.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-gray-800 dark:text-white text-sm">
                      {achievement.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {achievement.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleClose}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          Awesome!
        </button>
      </div>
    </div>
  );
};

export default LevelUpModal;
