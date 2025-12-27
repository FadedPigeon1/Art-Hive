import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ArtJamCanvas from "../components/ArtJamCanvas";
import { toast } from "react-toastify";

const ArtJam = () => {
  const { user } = useAuth();
  const [jamCode, setJamCode] = useState("");
  const [nickname, setNickname] = useState(user?.username || "");
  const [isJoined, setIsJoined] = useState(false);

  const handleCreate = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setJamCode(code);
    setIsJoined(true);
  };

  const handleJoin = () => {
    if (!jamCode || !nickname) {
      toast.error("Please enter a code and nickname");
      return;
    }
    setIsJoined(true);
  };

  if (isJoined) {
    return (
      <ArtJamCanvas
        jamCode={jamCode}
        nickname={nickname}
        userId={user?._id}
        onLeave={() => setIsJoined(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-96">
        <h1 className="text-3xl font-bold mb-6 text-center text-purple-500">
          Art Jam
        </h1>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nickname</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your name"
            />
          </div>

          <div className="border-t border-gray-700 pt-4">
            <label className="block text-sm font-medium mb-1">
              Join Existing Jam
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={jamCode}
                onChange={(e) => setJamCode(e.target.value.toUpperCase())}
                className="flex-1 bg-gray-700 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ROOM CODE"
              />
              <button
                onClick={handleJoin}
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded font-bold"
              >
                Join
              </button>
            </div>
          </div>

          <div className="text-center text-gray-500 my-2">- OR -</div>

          <button
            onClick={handleCreate}
            className="w-full bg-green-600 hover:bg-green-700 py-3 rounded font-bold text-lg"
          >
            Create New Jam
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArtJam;
