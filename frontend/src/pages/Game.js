import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { useAuth } from "../context/AuthContext";
import { gameAPI, postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import { FiCopy, FiUpload } from "react-icons/fi";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

const Game = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const canvasRef = useRef(null);

  // Game state
  const [gameState, setGameState] = useState("menu"); // menu, lobby, drawing, prompt, results
  const [gameCode, setGameCode] = useState("");
  const [nickname, setNickname] = useState(user?.username || "");
  const [currentGame, setCurrentGame] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [promptText, setPromptText] = useState("");
  const [drawings, setDrawings] = useState([]);

  // Drawing state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushRadius, setBrushRadius] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("player-joined", (data) => {
      toast.info(`${data.nickname} joined the game!`);
    });

    newSocket.on("drawing-submitted", (data) => {
      console.log("Drawing submitted:", data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (gameState === "drawing" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      setContext(ctx);

      canvas.width = canvas.offsetWidth;
      canvas.height = 400;

      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [gameState]);

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (context) {
      context.beginPath();
      context.moveTo(x, y);
    }
  };

  const draw = (e) => {
    if (!isDrawing || !context) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    context.strokeStyle = brushColor;
    context.lineWidth = brushRadius * 2;
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas && context) {
      context.fillStyle = "#FFFFFF";
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleCreateGame = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    try {
      const { data } = await gameAPI.createGame(nickname, 3);
      setCurrentGame(data);
      setGameCode(data.code);
      setGameState("lobby");

      if (socket) {
        socket.emit("join-game", { code: data.code, nickname });
      }

      toast.success(`Game created! Code: ${data.code}`);
    } catch (error) {
      toast.error("Failed to create game");
    }
  };

  const handleJoinGame = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    if (!gameCode.trim()) {
      toast.error("Please enter a game code");
      return;
    }

    try {
      const { data } = await gameAPI.joinGame(
        gameCode.toUpperCase(),
        nickname,
        user?._id
      );
      setCurrentGame(data);
      setGameState("lobby");

      if (socket) {
        socket.emit("join-game", { code: gameCode.toUpperCase(), nickname });
      }

      toast.success("Joined game successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join game");
    }
  };

  const handleStartGame = () => {
    setGameState("prompt");
    setCurrentRound(1);
  };

  const handleSubmitPrompt = async () => {
    if (!promptText.trim()) {
      toast.error("Please enter a prompt");
      return;
    }

    try {
      await gameAPI.submitDrawing(currentGame.code, {
        playerNickname: nickname,
        type: "prompt",
        data: promptText,
        round: currentRound,
      });

      if (socket) {
        socket.emit("submit-prompt", {
          code: currentGame.code,
          prompt: promptText,
          round: currentRound,
        });
      }

      setGameState("drawing");
      setPromptText("");
      toast.success("Prompt submitted!");
    } catch (error) {
      toast.error("Failed to submit prompt");
    }
  };

  const handleSubmitDrawing = async () => {
    if (!canvasRef.current) return;

    try {
      const drawingData = canvasRef.current.toDataURL("image/png");

      await gameAPI.submitDrawing(currentGame.code, {
        playerNickname: nickname,
        type: "drawing",
        data: drawingData,
        round: currentRound,
      });

      setDrawings([...drawings, drawingData]);

      if (socket) {
        socket.emit("submit-drawing", {
          code: currentGame.code,
          drawing: drawingData,
          round: currentRound,
        });
      }

      if (currentRound < currentGame.totalRounds) {
        setCurrentRound(currentRound + 1);
        setGameState("prompt");
      } else {
        setGameState("results");
        await gameAPI.endGame(currentGame.code);
      }

      toast.success("Drawing submitted!");
    } catch (error) {
      toast.error("Failed to submit drawing");
    }
  };

  const handleRepostToFeed = async (drawingUrl) => {
    if (!isAuthenticated) {
      toast.error("Please login to repost artwork");
      navigate("/login");
      return;
    }

    try {
      await postsAPI.createPost({
        imageUrl: drawingUrl,
        caption: `Created in ArtHive Game - Code: ${currentGame.code}`,
        isGameArt: true,
        gameSessionId: currentGame._id,
      });

      toast.success("Posted to your feed!");
    } catch (error) {
      toast.error("Failed to post artwork");
    }
  };

  const copyGameCode = () => {
    navigator.clipboard.writeText(gameCode);
    toast.success("Game code copied!");
  };

  // Render different game states
  if (gameState === "menu") {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 text-center">
              ArtHive Game
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6 text-center">
              Draw, guess, and have fun! Inspired by Gartic Phone.
            </p>

            <div className="space-y-4 mb-6">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="Enter your nickname"
                className="w-full px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light"
                maxLength={20}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={handleCreateGame}
                className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Create New Game
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border-light dark:border-border-dark"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark">
                    OR
                  </span>
                </div>
              </div>

              <input
                type="text"
                value={gameCode}
                onChange={(e) => setGameCode(e.target.value.toUpperCase())}
                placeholder="Enter game code"
                className="w-full px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light uppercase"
                maxLength={6}
              />

              <button
                onClick={handleJoinGame}
                className="w-full py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-lg font-medium hover:bg-border-light dark:hover:bg-border-dark transition-colors"
              >
                Join Game
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "lobby") {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4 text-center">
              Game Lobby
            </h1>

            <div className="flex items-center justify-center space-x-3 mb-6">
              <span className="text-xl text-text-secondary-light dark:text-text-secondary-dark">
                Game Code:
              </span>
              <span className="text-3xl font-bold text-primary-light">
                {currentGame?.code}
              </span>
              <button
                onClick={copyGameCode}
                className="p-2 hover:bg-surface-light dark:hover:bg-surface-dark rounded-lg transition-colors"
              >
                <FiCopy size={20} />
              </button>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-text-primary-light dark:text-text-primary-dark mb-3">
                Players ({currentGame?.players?.length || 0})
              </h2>
              <div className="space-y-2">
                {currentGame?.players?.map((player, index) => (
                  <div
                    key={index}
                    className="px-4 py-3 bg-surface-light dark:bg-surface-dark rounded-lg"
                  >
                    <p className="text-text-primary-light dark:text-text-primary-dark">
                      {player.nickname}
                      {player.nickname === currentGame.hostId && (
                        <span className="ml-2 text-xs bg-primary-light text-white px-2 py-1 rounded">
                          HOST
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {nickname === currentGame?.hostId ? (
              <button
                onClick={handleStartGame}
                disabled={currentGame?.players?.length < 2}
                className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {currentGame?.players?.length < 2
                  ? "Waiting for players..."
                  : "Start Game"}
              </button>
            ) : (
              <p className="text-center text-text-secondary-light dark:text-text-secondary-dark">
                Waiting for host to start the game...
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "prompt") {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Round {currentRound} of {currentGame?.totalRounds}
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-6">
              Enter a drawing prompt
            </p>

            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="E.g., 'A cat playing piano', 'Sunset over mountains'..."
              className="w-full px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark rounded-lg border border-border-light dark:border-border-dark focus:outline-none focus:ring-2 focus:ring-primary-light resize-none mb-4"
              rows={4}
              maxLength={100}
            />

            <button
              onClick={handleSubmitPrompt}
              className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Submit Prompt
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "drawing") {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-6 border border-border-light dark:border-border-dark">
            <h1 className="text-2xl font-bold text-text-primary-light dark:text-text-primary-dark mb-2">
              Round {currentRound} of {currentGame?.totalRounds}
            </h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark mb-4">
              Draw the prompt!
            </p>

            {/* Drawing Controls */}
            <div className="mb-4 flex items-center space-x-4">
              <div className="flex space-x-2">
                {["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00"].map(
                  (color) => (
                    <button
                      key={color}
                      onClick={() => setBrushColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        brushColor === color
                          ? "border-primary-light"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  )
                )}
              </div>
              <input
                type="range"
                min="1"
                max="15"
                value={brushRadius}
                onChange={(e) => setBrushRadius(Number(e.target.value))}
                className="flex-1"
              />
              <button
                onClick={clearCanvas}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Clear
              </button>
            </div>

            {/* Canvas */}
            <div className="bg-white rounded-lg mb-4 overflow-hidden">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full cursor-crosshair"
                style={{ touchAction: "none" }}
              />
            </div>

            <button
              onClick={handleSubmitDrawing}
              className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
            >
              Submit Drawing
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "results") {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 text-center">
              Game Results!
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {drawings.map((drawing, index) => (
                <div key={index} className="relative">
                  <img
                    src={drawing}
                    alt={`Drawing ${index + 1}`}
                    className="w-full rounded-lg border border-border-light dark:border-border-dark"
                  />
                  <button
                    onClick={() => handleRepostToFeed(drawing)}
                    className="mt-2 w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors"
                  >
                    <FiUpload />
                    <span>Post to Feed</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setGameState("menu");
                setCurrentGame(null);
                setDrawings([]);
                setCurrentRound(0);
              }}
              className="w-full py-3 bg-surface-light dark:bg-surface-dark text-text-primary-light dark:text-text-primary-dark border border-border-light dark:border-border-dark rounded-lg font-medium hover:bg-border-light dark:hover:bg-border-dark transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default Game;
