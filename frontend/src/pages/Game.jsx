import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { gameAPI, postsAPI } from "../utils/api";
import { toast } from "react-toastify";
import GameMenu from "../components/game/GameMenu";
import GameLobby from "../components/game/GameLobby";
import GameTask from "../components/game/GameTask";
import GameResults from "../components/game/GameResults";
import { useGameSocket } from "../hooks/useGameSocket";

const Game = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [socket, setSocket] = useState(null);
  const currentGameRef = useRef(null);
  const hasJoinedRoom = useRef(false);
  const shouldSaveToStorage = useRef(true);
  const hasLeftGame = useRef(false);

  // Game state
  const [gameState, setGameState] = useState("menu"); // menu, lobby, task, results
  const [gameCode, setGameCode] = useState("");
  const [nickname, setNickname] = useState(user?.username || "");
  const [maxPlayers, setMaxPlayers] = useState(12);
  const [gameMode, setGameMode] = useState("classic");
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

  // Reveal state for results
  const [currentRevealChain, setCurrentRevealChain] = useState(0);
  const [currentRevealStep, setCurrentRevealStep] = useState(0);
  const [isRevealing, setIsRevealing] = useState(false);

  // Keep currentGameRef in sync
  useEffect(() => {
    currentGameRef.current = currentGame;
  }, [currentGame]);

  // Initialize socket connection
  useGameSocket({
    setSocket,
    currentGameRef,
    setCurrentGame,
    setGameState,
    setCurrentRound,
    setHasSubmitted,
    setSubmittedCount,
    setCurrentTask,
    setTotalPlayers,
    setPromptText,
    setChains,
    setCurrentRevealChain,
    setCurrentRevealStep,
    setIsRevealing,
    nickname,
  });

  // Load game state from localStorage on mount OR rejoin from URL
  useEffect(() => {
    // Check for rejoin parameter (returning from sketchbook)
    const params = new URLSearchParams(location.search);
    const rejoinCode = params.get("code");
    const isRejoin = params.get("rejoin") === "true";

    if (isRejoin && rejoinCode) {
      console.log("[REJOIN] Rejoining game:", rejoinCode);

      // Get saved game state
      const savedGameState = localStorage.getItem("arthive_game_state");
      if (savedGameState) {
        try {
          const {
            gameCode: savedCode,
            nickname: savedNickname,
            gameState: savedState,
          } = JSON.parse(savedGameState);

          if (savedCode === rejoinCode.toUpperCase()) {
            setGameCode(savedCode);
            setNickname(savedNickname);

            // Fetch current game state
            gameAPI
              .getGame(savedCode)
              .then(({ data }) => {
                setCurrentGame(data);

                if (data.status === "in-progress") {
                  setCurrentRound(data.currentRound);
                  setGameState("task");

                  // Get task to show UI and check submission status
                  gameAPI
                    .getPlayerTask(savedCode, savedNickname)
                    .then(({ data: task }) => {
                      setCurrentTask(task);
                      setHasSubmitted(task.alreadySubmitted || false);
                    });
                } else if (data.status === "waiting") {
                  setGameState("lobby");
                } else if (data.status === "finished") {
                  setGameState("results");
                  gameAPI.getResults(savedCode).then(({ data: results }) => {
                    setChains(results.chains);
                  });
                }

                shouldSaveToStorage.current = true;
              })
              .catch((error) => {
                console.error("[REJOIN] Failed to fetch game:", error);
                localStorage.removeItem("arthive_game_state");
                toast.error("Failed to rejoin game");
              });

            return;
          }
        } catch (error) {
          console.error("[REJOIN] Error parsing saved state:", error);
        }
      }
    }

    // Don't restore if we just left
    if (hasLeftGame.current) {
      hasLeftGame.current = false;
      return;
    }

    const savedGameState = localStorage.getItem("arthive_game_state");
    if (savedGameState) {
      try {
        const { gameCode: savedCode, nickname: savedNickname } =
          JSON.parse(savedGameState);

        if (savedCode && savedNickname) {
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
                shouldSaveToStorage.current = true;

                // Determine state based on backend status
                if (data.status === "waiting") {
                  setGameState("lobby");
                } else if (data.status === "in-progress") {
                  setGameState("task");
                  setCurrentRound(data.currentRound);
                  // Fetch task
                  gameAPI
                    .getPlayerTask(savedCode, savedNickname)
                    .then(({ data: task }) => {
                      setCurrentTask(task);
                      setHasSubmitted(task.alreadySubmitted || false);
                    })
                    .catch(console.error);
                } else if (data.status === "finished") {
                  setGameState("results");
                  gameAPI.getResults(savedCode).then(({ data: results }) => {
                    setChains(results.chains);
                  });
                }
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
  }, [location.search, nickname]);

  // Save game state to localStorage
  useEffect(() => {
    if (
      currentGame &&
      (gameState === "lobby" ||
        gameState === "task" ||
        gameState === "results") &&
      shouldSaveToStorage.current
    ) {
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
            setHasSubmitted(task.alreadySubmitted || false);
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
  }, [gameState, currentGame, nickname]);

  const handleCreateGame = async () => {
    if (!nickname.trim()) {
      toast.error("Please enter a nickname");
      return;
    }

    try {
      const { data } = await gameAPI.createGame(
        nickname,
        3,
        maxPlayers,
        gameMode
      );
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
      setHasSubmitted(task.alreadySubmitted || false);
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

  const handleSubmitTask = async (drawingData = null) => {
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
      if (drawingData) {
        data = drawingData; // This is now a File object
      } else {
        // Drawings are submitted from Sketchbook Pro, not here
        toast.error("Please use Sketchbook Pro to submit drawings");
        return;
      }
    }

    try {
      // Submit entry
      console.log("[SUBMIT] Calling API with:", {
        code: currentGame.code,
        playerNickname: nickname,
        chainId: currentTask.chainId,
        type: taskType,
      });

      const formData = new FormData();
      formData.append("playerNickname", nickname);
      formData.append("chainId", currentTask.chainId);
      formData.append("type", taskType);

      if (taskType === "drawing") {
        formData.append("image", data);
      } else {
        formData.append("data", data);
      }

      const response = await gameAPI.submitEntry(currentGame.code, formData);

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
        setSubmittedCount(0); // Reset counter for new round
        // Fetch next task
        const { data: nextTask } = await gameAPI.getPlayerTask(
          currentGame.code,
          nickname
        );
        console.log("[SUBMIT] Next task:", nextTask);
        setCurrentTask(nextTask);
        setHasSubmitted(nextTask.alreadySubmitted || false);
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

  const handleRepostToFeed = async (drawingUrl) => {
    if (!isAuthenticated) {
      toast.error("Please login to repost artwork");
      navigate("/login");
      return;
    }

    try {
      await postsAPI.createPost({
        title: `Game Art - ${currentGame.code}`,
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
    navigator.clipboard.writeText(currentGame?.code || gameCode);
    toast.success("Game code copied!");
  };

  const handleRevealNext = () => {
    if (!currentGame || !chains || chains.length === 0) return;

    const isHost = nickname === currentGame.hostId;
    if (!isHost) {
      toast.error("Only the host can control reveals");
      return;
    }

    const currentChain = chains[currentRevealChain];
    if (!currentChain) return;

    // Show original prompt first, then each entry
    const totalSteps = currentChain.entries.length + 1; // +1 for original prompt

    if (currentRevealStep < totalSteps - 1) {
      // Move to next step in current chain
      const nextStep = currentRevealStep + 1;
      setCurrentRevealStep(nextStep);
      setIsRevealing(true);

      if (socket) {
        socket.emit("reveal-step", {
          code: currentGame.code,
          chainIndex: currentRevealChain,
          stepIndex: nextStep,
        });
      }
    } else if (currentRevealChain < chains.length - 1) {
      // Move to next chain
      const nextChain = currentRevealChain + 1;
      setCurrentRevealChain(nextChain);
      setCurrentRevealStep(0);
      setIsRevealing(true);

      if (socket) {
        socket.emit("reveal-step", {
          code: currentGame.code,
          chainIndex: nextChain,
          stepIndex: 0,
        });
      }
    } else {
      // All done
      toast.info("All chains revealed!");
    }
  };

  const handleRevealReset = () => {
    const isHost = nickname === currentGame.hostId;
    if (!isHost) {
      toast.error("Only the host can control reveals");
      return;
    }

    setCurrentRevealChain(0);
    setCurrentRevealStep(0);
    setIsRevealing(false);

    if (socket) {
      socket.emit("reveal-reset", { code: currentGame.code });
    }
  };

  // Render different game states
  if (gameState === "menu") {
    return (
      <GameMenu
        nickname={nickname}
        setNickname={setNickname}
        gameCode={gameCode}
        setGameCode={setGameCode}
        maxPlayers={maxPlayers}
        setMaxPlayers={setMaxPlayers}
        gameMode={gameMode}
        setGameMode={setGameMode}
        handleCreateGame={handleCreateGame}
        handleJoinGame={handleJoinGame}
      />
    );
  }

  if (gameState === "lobby") {
    return (
      <GameLobby
        currentGame={currentGame}
        nickname={nickname}
        copyGameCode={copyGameCode}
        handleStartGame={handleStartGame}
        handleLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (gameState === "task") {
    return (
      <GameTask
        currentTask={currentTask}
        currentRound={currentRound}
        currentGame={currentGame}
        nickname={nickname}
        promptText={promptText}
        setPromptText={setPromptText}
        hasSubmitted={hasSubmitted}
        handleSubmitTask={handleSubmitTask}
        submittedCount={submittedCount}
        totalPlayers={totalPlayers}
      />
    );
  }

  if (gameState === "results") {
    return (
      <GameResults
        currentGame={currentGame}
        nickname={nickname}
        chains={chains}
        isRevealing={isRevealing}
        currentRevealChain={currentRevealChain}
        currentRevealStep={currentRevealStep}
        socket={socket}
        setIsRevealing={setIsRevealing}
        setCurrentRevealChain={setCurrentRevealChain}
        setCurrentRevealStep={setCurrentRevealStep}
        handleRevealNext={handleRevealNext}
        handleRevealReset={handleRevealReset}
        handleRepostToFeed={handleRepostToFeed}
        setGameState={setGameState}
        setCurrentGame={setCurrentGame}
        setDrawings={setDrawings}
        setChains={setChains}
        setCurrentRound={setCurrentRound}
        setCurrentTask={setCurrentTask}
        setHasSubmitted={setHasSubmitted}
      />
    );
  }

  return null;
};

export default Game;
