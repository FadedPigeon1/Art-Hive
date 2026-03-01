import React, { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaPalette, FaGamepad } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import client from "../utils/api/client";

const CreativeActions = () => {
  const { user } = useAuth();
  const [challengeData, setChallengeData] = useState(null);
  const [loading, setLoading] = useState(true);

  const prompts = [
    "Cyberpunk Cat",
    "Floating Island",
    "Neon City",
    "Underwater Tea Party",
    "Steampunk Robot",
    "Space Cowboy",
    "Future Forest",
    "Crystal Cave",
    "Flying Car",
    "Magical Library",
    "Dragon's Hoard",
    "Haunted House",
    "Alien Landscape",
    "Pixel Art Hero",
    "Sunset Boulevard",
  ];

  // Get a consistent prompt based on the current date (Central Time)
  const dailyPrompt = useMemo(() => {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const dateString = formatter.format(now);

    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }

    const index = Math.abs(hash) % prompts.length;
    return prompts[index];
  }, []);

  // Fetch today's challenge data
  useEffect(() => {
    const fetchChallengeData = async () => {
      try {
        const { data } = await client.get("/api/challenges/today");
        setChallengeData(data.challenge);
      } catch (error) {
        console.error("Error fetching challenge:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallengeData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Daily Challenge Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-[#1DA1F2] to-[#8B5CF6] rounded-xl p-6 text-white shadow-lg shadow-[#1DA1F2]/20 transition-all duration-300 hover:shadow-xl hover:shadow-[#1DA1F2]/30">
        {/* Abstract background blobs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/10 rounded-full blur-xl transform group-hover:scale-150 transition-transform duration-700"></div>

        <div className="relative flex items-center justify-between mb-4">
          <h3 className="text-xl font-black tracking-tight">Daily Challenge</h3>
          <FaPalette className="text-2xl opacity-90 transform group-hover:rotate-12 transition-transform duration-300" />
        </div>

        {/* Challenge Status & Streak */}
        <div className="relative flex flex-wrap items-center gap-2 mb-3">
          {challengeData?.hasCompleted && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
              <span className="text-green-300">✓</span> Completed
            </span>
          )}
          {user?.dailyChallengeStreak > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/80 backdrop-blur-sm text-white text-xs font-bold rounded-full shadow-sm border border-orange-400/50">
              🔥 {user.dailyChallengeStreak} Day Streak
            </span>
          )}
        </div>

        <div className="relative">
          <p className="text-white/80 mb-1 text-sm font-medium uppercase tracking-wider">
            Today's Prompt:
          </p>
          <p className="text-2xl font-black mb-2 text-white drop-shadow-md">
            "{dailyPrompt}"
          </p>
        </div>

        {/* XP Reward */}
        {!challengeData?.hasCompleted && challengeData?.xpReward && (
          <p className="relative inline-flex items-center gap-1.5 text-sm font-bold text-yellow-300 mb-5 bg-black/20 px-3 py-1 rounded-lg">
            <span>✨</span> +{challengeData.xpReward} XP
          </p>
        )}

        <div className="relative">
          {challengeData?.hasCompleted ? (
            <div className="w-full text-center bg-white/20 backdrop-blur-sm text-white font-bold py-2.5 rounded-xl cursor-not-allowed border border-white/20">
              Challenge Completed! 🎉
            </div>
          ) : (
            <Link
              to={`/sketchbook?prompt=${encodeURIComponent(
                dailyPrompt,
              )}&challenge=${challengeData?._id || ""}`}
              className="block w-full text-center bg-white/95 text-[#1DA1F2] font-black py-2.5 rounded-xl hover:bg-white transition-all duration-300 hover:shadow-lg transform active:scale-95"
            >
              Start Drawing
            </Link>
          )}
        </div>
      </div>

      {/* Game Lobby Card */}
      <div className="group relative overflow-hidden bg-gradient-to-br from-pink-500 to-rose-600 dark:from-pink-600 dark:to-rose-700 rounded-xl p-6 text-white shadow-lg shadow-pink-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/30">
        {/* Abstract background blobs */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transform group-hover:scale-150 transition-transform duration-700"></div>
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/10 rounded-full blur-xl transform group-hover:scale-150 transition-transform duration-700"></div>

        <div className="relative flex items-center justify-between mb-4">
          <h3 className="text-xl font-black tracking-tight">Game Room</h3>
          <FaGamepad className="text-2xl opacity-90 transform group-hover:-rotate-12 transition-transform duration-300" />
        </div>
        <div className="relative">
          <p className="text-white/90 mb-6 font-medium">
            Challenge your friends to a drawing battle!
          </p>
          <Link
            to="/game"
            className="block w-full text-center bg-white/95 text-pink-600 font-black py-2.5 rounded-xl hover:bg-white transition-all duration-300 hover:shadow-lg transform active:scale-95"
          >
            Play Now
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CreativeActions;
