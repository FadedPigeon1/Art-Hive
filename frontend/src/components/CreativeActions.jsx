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
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Daily Challenge</h3>
          <FaPalette className="text-2xl opacity-80" />
        </div>

        {/* Challenge Status & Streak */}
        <div className="flex items-center gap-3 mb-3">
          {challengeData?.hasCompleted && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500 text-white text-xs font-semibold rounded-full">
              ✓ Completed
            </span>
          )}
          {user?.dailyChallengeStreak > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
              🔥 {user.dailyChallengeStreak} Day Streak
            </span>
          )}
        </div>

        <p className="text-purple-100 mb-2 text-sm">Today's Prompt:</p>
        <p className="text-2xl font-black mb-2">"{dailyPrompt}"</p>

        {/* XP Reward */}
        {!challengeData?.hasCompleted && challengeData?.xpReward && (
          <p className="text-sm text-purple-200 mb-4">
            +{challengeData.xpReward} XP reward
          </p>
        )}

        {challengeData?.hasCompleted ? (
          <div className="w-full text-center bg-white/20 text-white font-bold py-2 rounded-lg cursor-not-allowed">
            Challenge Completed! 🎉
          </div>
        ) : (
          <Link
            to={`/sketchbook?prompt=${encodeURIComponent(
              dailyPrompt
            )}&challenge=${challengeData?._id || ""}`}
            className="block w-full text-center bg-white text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 transition"
          >
            Start Drawing
          </Link>
        )}
      </div>

      {/* Game Lobby Card */}
      <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Game Room</h3>
          <FaGamepad className="text-2xl opacity-80" />
        </div>
        <p className="text-pink-100 mb-6">
          Challenge your friends to a drawing battle!
        </p>
        <Link
          to="/game"
          className="block w-full text-center bg-white text-pink-600 font-bold py-2 rounded-lg hover:bg-pink-50 transition"
        >
          Play Now
        </Link>
      </div>
    </div>
  );
};

export default CreativeActions;
