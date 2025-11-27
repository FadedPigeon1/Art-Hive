import React from "react";
import { Link } from "react-router-dom";
import { FaPalette, FaGamepad } from "react-icons/fa";

const CreativeActions = () => {
  const prompts = [
    "Cyberpunk Cat",
    "Floating Island",
    "Neon City",
    "Underwater Tea Party",
    "Steampunk Robot",
    "Space Cowboy",
  ];
  const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

  return (
    <div className="space-y-6">
      {/* Daily Challenge Card */}
      <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg transform transition hover:scale-105">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Daily Challenge</h3>
          <FaPalette className="text-2xl opacity-80" />
        </div>
        <p className="text-purple-100 mb-2 text-sm">Today's Prompt:</p>
        <p className="text-2xl font-black mb-6">"{randomPrompt}"</p>
        <Link
          to={`/sketchbook?prompt=${encodeURIComponent(randomPrompt)}`}
          className="block w-full text-center bg-white text-purple-700 font-bold py-2 rounded-lg hover:bg-purple-50 transition"
        >
          Start Drawing
        </Link>
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
