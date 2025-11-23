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
  const currentGameRef = useRef(null);
  const hasJoinedRoom = useRef(false);
  const shouldSaveToStorage = useRef(true);
  const hasLeftGame = useRef(false);

  // Game state
  const [gameState, setGameState] = useState("menu"); // menu, lobby, task, results
  const [gameCode, setGameCode] = useState("");
  const [nickname, setNickname] = useState(user?.username || "");
  const [currentGame, setCurrentGame] = useState(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [promptText, setPromptText] = useState("");
  const [drawings, setDrawings] = useState([]);
  const [chains, setChains] = useState([]); // Gartic Phone chains for results

  // Gartic Phone specific state
  const [currentTask, setCurrentTask] = useState(null); // {chainId, taskType, previousEntry}
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submittedCount, setSubmittedCount] = useState(0); // Track how many players have submitted
  const [totalPlayers, setTotalPlayers] = useState(0); // Total players in game

  // Drawing state
  const [brushColor, setBrushColor] = useState("#000000");
  const [brushRadius, setBrushRadius] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState(null);

  // Keep currentGameRef in sync
  useEffect(() => {
    currentGameRef.current = currentGame;
  }, [currentGame]);

  // Load game state from localStorage on mount
  useEffect(() => {
    // Don't restore if we just left
    if (hasLeftGame.current) {
      hasLeftGame.current = false;
      return;
    }

    const savedGameState = localStorage.getItem("arthive_game_state");
    if (savedGameState) {
      try {
        const {
          gameCode: savedCode,
          nickname: savedNickname,
          gameState: savedState,
        } = JSON.parse(savedGameState);
        if (savedCode && savedNickname && savedState === "lobby") {
          // Try to rejoin the game
          setGameCode(savedCode);
          setNickname(savedNickname);
          gameAPI
            .getGame(savedCode)
            .then(({ data }) => {
              // Check if the player is still in the game
              const playerStillInGame = data.players.some(
                (player) => player.nickname === savedNickname
              );

              if (playerStillInGame) {
                setCurrentGame(data);
                setGameState("lobby");
                shouldSaveToStorage.current = true;
              } else {
                // Player was removed, clear the saved state and don't restore
                localStorage.removeItem("arthive_game_state");
                shouldSaveToStorage.current = false;
              }
            })
            .catch(() => {
              localStorage.removeItem("arthive_game_state");
              shouldSaveToStorage.current = false;
            });
        }
      } catch (error) {
        localStorage.removeItem("arthive_game_state");
        shouldSaveToStorage.current = false;
      }
    }
  }, []);

  // Save game state to localStorage
  useEffect(() => {
    if (currentGame && gameState === "lobby" && shouldSaveToStorage.current) {
      localStorage.setItem(
        "arthive_game_state",
        JSON.stringify({
          gameCode: currentGame.code,
          nickname,
          gameState,
        })
      );
    } else if (gameState === "menu") {
      localStorage.removeItem("arthive_game_state");
      shouldSaveToStorage.current = true; // Reset for next time
    }
  }, [currentGame, gameState, nickname]);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.on("player-joined", async (data) => {
      toast.info(`${data.nickname} joined the game!`);
      // Refresh game session to show new player
      if (currentGameRef.current) {
        try {
          const { data: updatedGame } = await gameAPI.getGame(
            currentGameRef.current.code
          );
          setCurrentGame(updatedGame);
        } catch (error) {
          console.error("Failed to refresh game:", error);
        }
      }
    });

    newSocket.on("player-left", async (data) => {
      toast.info(`${data.nickname} left the game`);
      // Refresh game session to update player list
      if (currentGameRef.current) {
        try {
          const { data: updatedGame } = await gameAPI.getGame(
            currentGameRef.current.code
          );
          setCurrentGame(updatedGame);
        } catch (error) {
          console.error("Failed to refresh game:", error);
        }
      }
    });

    newSocket.on("game-started", async (data) => {
      console.log("[SOCKET] Game started event received:", data);
      setGameState("task");
      setCurrentRound(1);
      setHasSubmitted(false);
      setSubmittedCount(0);
      // Fetch the first task
      try {
        console.log(
          "[SOCKET] Fetching task for:",
          currentGameRef.current?.code,
          nickname
        );
        const { data: task } = await gameAPI.getPlayerTask(
          currentGameRef.current.code,
          nickname
        );
        console.log("[SOCKET] Task received:", task);
        setCurrentTask(task);
        setTotalPlayers(currentGameRef.current?.players?.length || 0);
      } catch (error) {
        console.error("[SOCKET] Failed to get task:", error);
        toast.error("Failed to load task. Please refresh.");
      }
      toast.info("Game started!");
    });

    newSocket.on("prompt-submitted", (data) => {
      toast.info(`${data.nickname} submitted their prompt!`);
    });

    newSocket.on("drawing-submitted", (data) => {
      console.log("Drawing submitted:", data);
    });

    newSocket.on(
      "player-submitted",
      async ({ nickname: submittedNickname, round }) => {
        if (submittedNickname !== nickname) {
          toast.info(`${submittedNickname} submitted!`);

          // Update submission count by fetching game state
          try {
            const { data: gameData } = await gameAPI.getGame(
              currentGameRef.current?.code
            );
            if (gameData && gameData.currentRound === round) {
              const submitted = gameData.chains.filter((c) =>
                c.entries.some((e) => e.round === round)
              ).length;
              setSubmittedCount(submitted);
              setTotalPlayers(gameData.players.length);
            }
          } catch (error) {
            console.error("Failed to update submission count:", error);
          }
        }
      }
    );

    newSocket.on("next-round", async (data) => {
      try {
        setCurrentRound(data.round);
        setHasSubmitted(false);
        setPromptText("");
        setSubmittedCount(0); // Reset counter for new round

        // Fetch new task for the new round
        const { data: task } = await gameAPI.getPlayerTask(
          currentGameRef.current?.code,
          nickname
        );
        setCurrentTask(task);

        toast.info(`Round ${data.round} started!`);
      } catch (error) {
        console.error("Failed to fetch next task:", error);
        toast.error("Failed to load next round");
      }
    });

    newSocket.on("game-ended", async (data) => {
      try {
        const { data: results } = await gameAPI.getResults(
          currentGameRef.current?.code
        );
        setChains(results.chains);
        setGameState("results");
        toast.info("Game finished!");
      } catch (error) {
        console.error("Failed to fetch results:", error);
        toast.error("Failed to load results");
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Join socket room when entering lobby
  useEffect(() => {
    if (
      socket &&
      currentGame &&
      gameState === "lobby" &&
      !hasJoinedRoom.current
    ) {
      console.log("Joining game room:", currentGame.code);
      socket.emit("join-game", { code: currentGame.code, nickname });
      hasJoinedRoom.current = true;
    } else if (gameState !== "lobby") {
      hasJoinedRoom.current = false;
    }
  }, [socket, currentGame, gameState, nickname]);

  // Poll for game updates in lobby
  useEffect(() => {
    let pollInterval;
    if (gameState === "lobby" && currentGame) {
      pollInterval = setInterval(async () => {
        try {
          const { data: updatedGame } = await gameAPI.getGame(currentGame.code);
          setCurrentGame(updatedGame);
          // Check if game has started
          if (
            updatedGame.status === "in-progress" &&
            updatedGame.currentRound > 0 &&
            gameState === "lobby"
          ) {
            clearInterval(pollInterval);
            // Fetch first task
            const { data: task } = await gameAPI.getPlayerTask(
              updatedGame.code,
              nickname
            );
            setCurrentTask(task);
            setCurrentRound(updatedGame.currentRound);
            setGameState("task");
            toast.info("Game started!");
          }
        } catch (error) {
          console.error("Failed to poll game:", error);
        }
      }, 2000); // Poll every 2 seconds
    }
    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [gameState, currentGame?.code, nickname]);

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
      toast.success("Joined game successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to join game");
    }
  };

  const handleStartGame = async () => {
    if (!currentGame) return;

    console.log("[START GAME] Starting game with code:", currentGame.code);
    console.log("[START GAME] Current game state:", currentGame);
    console.log("[START GAME] Player nickname:", nickname);

    try {
      // Update game status in database
      const response = await gameAPI.startGame(currentGame.code);
      console.log("[START GAME] Start game response:", response);

      // Update local state immediately
      const updatedGame = response.data.gameSession;
      setCurrentGame(updatedGame);
      setCurrentRound(1);
      setHasSubmitted(false);
      setSubmittedCount(0);
      setTotalPlayers(updatedGame.players.length);

      // Get first task
      console.log("[START GAME] Fetching first task for:", nickname);
      const { data: task } = await gameAPI.getPlayerTask(
        updatedGame.code,
        nickname
      );
      console.log("[START GAME] First task received:", task);
      setCurrentTask(task);
      setGameState("task");

      // Notify other players via socket
      if (socket) {
        console.log("[START GAME] Emitting start-game socket event");
        socket.emit("start-game", { code: updatedGame.code });
      }

      toast.success("Game started!");
    } catch (error) {
      toast.error("Failed to start game");
      console.error("[START GAME] Error:", error);
      console.error("[START GAME] Error response:", error.response?.data);
    }
  };

  const handleLeaveRoom = async () => {
    if (!currentGame) return;

    const codeToLeave = currentGame.code;
    const nicknameLeaving = nickname;

    // Mark that we've left to prevent rejoining on refresh
    hasLeftGame.current = true;

    // Immediately clear localStorage and prevent saving
    localStorage.removeItem("arthive_game_state");
    shouldSaveToStorage.current = false;

    // Reset state immediately
    setCurrentGame(null);
    setGameCode("");
    setGameState("menu");
    hasJoinedRoom.current = false;

    try {
      // Leave socket room first
      if (socket) {
        socket.emit("leave-game", {
          code: codeToLeave,
          nickname: nicknameLeaving,
        });
      }

      // Call backend to remove player from game
      await gameAPI.leaveGame(codeToLeave, nicknameLeaving);

      toast.info("Left the game");
    } catch (error) {
      console.error("Error leaving game:", error);
      toast.info("Left the game");
    }
  };

  const handleSubmitTask = async () => {
    if (!currentTask) {
      console.error("[SUBMIT] No current task");
      toast.error("No task available");
      return;
    }

    let data;
    const taskType = currentTask.taskType;

    console.log("[SUBMIT] Submitting task:", {
      taskType,
      chainId: currentTask.chainId,
      round: currentRound,
      nickname,
    });

    // Validate and get data
    if (taskType === "prompt") {
      if (!promptText.trim()) {
        toast.error("Please enter a prompt or guess");
        return;
      }
      data = promptText;
      console.log("[SUBMIT] Prompt data:", data);
    } else if (taskType === "drawing") {
      if (!canvasRef.current) {
        console.error("[SUBMIT] Canvas ref not available");
        return;
      }
      data = canvasRef.current.toDataURL("image/png");
      console.log("[SUBMIT] Drawing data length:", data.length);
    }

    try {
      // Submit entry
      console.log("[SUBMIT] Calling API with:", {
        code: currentGame.code,
        playerNickname: nickname,
        chainId: currentTask.chainId,
        type: taskType,
        dataLength: data.length,
      });

      const response = await gameAPI.submitEntry(currentGame.code, {
        playerNickname: nickname,
        chainId: currentTask.chainId,
        type: taskType,
        data: data,
      });

      console.log("[SUBMIT] API response:", response.data);

      setHasSubmitted(true);
      setPromptText("");

      // Update submission tracking
      setSubmittedCount(response.data.submittedCount || 0);
      setTotalPlayers(
        response.data.totalPlayers || currentGame?.players?.length || 0
      );

      // Notify via socket
      if (socket) {
        console.log("[SUBMIT] Emitting entry-submitted socket event");
        socket.emit("entry-submitted", {
          code: currentGame.code,
          nickname,
          round: currentRound,
        });
      }

      toast.success(
        taskType === "prompt" ? "Prompt submitted!" : "Drawing submitted!"
      );

      // Check if game ended or round advanced
      if (response.data.gameSession.status === "finished") {
        console.log("[SUBMIT] Game finished");
        setGameState("results");
        setCurrentGame(response.data.gameSession);
      } else if (response.data.allSubmitted) {
        // All players submitted, move to next round
        console.log("[SUBMIT] All players submitted, moving to next round");
        setCurrentRound(response.data.gameSession.currentRound);
        setHasSubmitted(false);
        setSubmittedCount(0); // Reset counter for new round
        // Fetch next task
        const { data: nextTask } = await gameAPI.getPlayerTask(
          currentGame.code,
          nickname
        );
        console.log("[SUBMIT] Next task:", nextTask);
        setCurrentTask(nextTask);
        toast.info(`Round ${response.data.gameSession.currentRound} started!`);
      }
    } catch (error) {
      console.error("[SUBMIT] Error:", error);
      console.error("[SUBMIT] Error response:", error.response?.data);
      toast.error(
        error.response?.data?.message || "Failed to submit. Please try again."
      );
    }
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
          nickname: nickname,
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
                      {player.nickname === nickname && (
                        <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded">
                          YOU
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mb-4 p-3 bg-surface-light dark:bg-surface-dark rounded-lg">
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Your nickname: <span className="font-semibold">{nickname}</span>
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                Host:{" "}
                <span className="font-semibold">{currentGame?.hostId}</span>
              </p>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                You are host:{" "}
                <span className="font-semibold">
                  {nickname === currentGame?.hostId ? "YES" : "NO"}
                </span>
              </p>
            </div>

            {nickname === currentGame?.hostId ? (
              <div className="space-y-3">
                <button
                  onClick={handleStartGame}
                  disabled={currentGame?.players?.length < 2}
                  className="w-full py-3 bg-primary-light text-white rounded-lg font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title={
                    currentGame?.players?.length < 2
                      ? `Need at least 2 players. Current: ${currentGame?.players?.length}`
                      : "Click to start the game"
                  }
                >
                  {currentGame?.players?.length < 2
                    ? `Waiting for players... (${currentGame?.players?.length}/2)`
                    : "Start Game"}
                </button>
                {currentGame?.status && (
                  <p className="text-xs text-center text-text-secondary-light dark:text-text-secondary-dark">
                    Game status: {currentGame.status}
                  </p>
                )}
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-2 text-red-500 hover:text-red-600 border border-red-500 hover:border-red-600 rounded-lg font-medium transition-colors"
                >
                  Leave Room
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-text-secondary-light dark:text-text-secondary-dark">
                  Waiting for host to start the game...
                </p>
                <button
                  onClick={handleLeaveRoom}
                  className="w-full py-2 text-red-500 hover:text-red-600 border border-red-500 hover:border-red-600 rounded-lg font-medium transition-colors"
                >
                  Leave Room
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "task") {
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
                {/* Drawing Controls */}
                <div className="mb-4 flex items-center space-x-4">
                  <div className="flex space-x-2">
                    {[
                      "#000000",
                      "#FF0000",
                      "#00FF00",
                      "#0000FF",
                      "#FFFF00",
                    ].map((color) => (
                      <button
                        key={color}
                        onClick={() => setBrushColor(color)}
                        className={`w-8 h-8 rounded-full border-2 ${
                          brushColor === color
                            ? "border-primary-light"
                            : "border-gray-300"
                        }`}
                        style={{ backgroundColor: color }}
                        disabled={hasSubmitted}
                      />
                    ))}
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    value={brushRadius}
                    onChange={(e) => setBrushRadius(Number(e.target.value))}
                    className="flex-1"
                    disabled={hasSubmitted}
                  />
                  <button
                    onClick={clearCanvas}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={hasSubmitted}
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
                    style={{
                      touchAction: "none",
                      pointerEvents: hasSubmitted ? "none" : "auto",
                    }}
                  />
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
  }

  if (gameState === "results") {
    return (
      <div className="min-h-screen bg-surface-light dark:bg-surface-dark py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-background-light dark:bg-background-dark rounded-lg shadow-lg p-8 border border-border-light dark:border-border-dark">
            <h1 className="text-3xl font-bold text-text-primary-light dark:text-text-primary-dark mb-6 text-center">
              Game Results!
            </h1>
            <p className="text-center text-text-secondary-light dark:text-text-secondary-dark mb-8">
              See how your prompts transformed through the game!
            </p>

            {/* Display each chain */}
            {chains.map((chain, chainIndex) => (
              <div
                key={chain.chainId}
                className="mb-8 p-6 bg-surface-light dark:bg-surface-dark rounded-lg border border-border-light dark:border-border-dark"
              >
                <h2 className="text-xl font-bold text-text-primary-light dark:text-text-primary-dark mb-4">
                  Chain {chainIndex + 1}: "{chain.originalPrompt}"
                </h2>

                <div className="space-y-4">
                  {chain.entries.map((entry, entryIndex) => (
                    <div
                      key={entryIndex}
                      className="p-4 bg-background-light dark:bg-background-dark rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-text-secondary-light dark:text-text-secondary-dark">
                          Round {entry.round} - {entry.playerNickname}
                        </span>
                        <span className="text-xs text-text-secondary-light dark:text-text-secondary-dark">
                          {entry.type === "prompt" ? "Wrote" : "Drew"}
                        </span>
                      </div>

                      {entry.type === "prompt" ? (
                        <p className="text-lg text-text-primary-light dark:text-text-primary-dark italic">
                          "{entry.data}"
                        </p>
                      ) : (
                        <div className="relative">
                          <img
                            src={entry.data}
                            alt={`Drawing by ${entry.playerNickname}`}
                            className="max-w-md mx-auto rounded-lg border border-border-light dark:border-border-dark"
                          />
                          <button
                            onClick={() => handleRepostToFeed(entry.data)}
                            className="mt-2 flex items-center space-x-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors"
                          >
                            <FiUpload />
                            <span>Post to Feed</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <button
              onClick={() => {
                setGameState("menu");
                setCurrentGame(null);
                setDrawings([]);
                setChains([]);
                setCurrentRound(0);
                setCurrentTask(null);
                setHasSubmitted(false);
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
