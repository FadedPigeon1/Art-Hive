import { useEffect } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { gameAPI } from "../utils/api";

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || "http://localhost:5000";

export const useGameSocket = ({
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
}) => {
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });
    setSocket(newSocket);

    newSocket.on("player-joined", async (data) => {
      toast.info(`${data.nickname} joined the game!`);
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
      // Only show toast if it's a real leave, not a refresh
      // We can't easily distinguish here without more backend logic,
      // but we can suppress the toast if the game is in progress to avoid panic
      if (currentGameRef.current?.status === "waiting") {
        toast.info(`${data.nickname} left the game`);
      }

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
      try {
        const { data: task } = await gameAPI.getPlayerTask(
          currentGameRef.current.code,
          nickname
        );
        setCurrentTask(task);
        setHasSubmitted(task.alreadySubmitted || false);
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
        // Force refresh game state to ensure player list is accurate
        const { data: updatedGame } = await gameAPI.getGame(
          currentGameRef.current?.code
        );
        setCurrentGame(updatedGame);

        setCurrentRound(data.round);
        setHasSubmitted(false);
        setPromptText("");
        setSubmittedCount(0);
        const { data: task } = await gameAPI.getPlayerTask(
          currentGameRef.current?.code,
          nickname
        );
        setCurrentTask(task);
        setHasSubmitted(task.alreadySubmitted || false);
        toast.info(`Round ${data.round} started!`);
      } catch (error) {
        console.error("Failed to fetch next task:", error);
        toast.error("Failed to load next round");
      }
    });

    newSocket.on("game-ended", async (data) => {
      if (data.reason === "not_enough_players") {
        toast.error("Game ended: Not enough players remaining.");
        setGameState("menu");
        setCurrentGame(null);
        return;
      }

      try {
        const { data: results } = await gameAPI.getResults(
          currentGameRef.current?.code
        );
        setChains(results.chains);
        setGameState("results");
        setCurrentRevealChain(0);
        setCurrentRevealStep(0);
        setIsRevealing(false);
        toast.info("Game finished!");
      } catch (error) {
        console.error("Failed to fetch results:", error);
        toast.error("Failed to load results");
      }
    });

    newSocket.on("reveal-next", ({ chainIndex, stepIndex }) => {
      console.log("[REVEAL] Next step:", chainIndex, stepIndex);
      setCurrentRevealChain(chainIndex);
      setCurrentRevealStep(stepIndex);
      setIsRevealing(true);
    });

    newSocket.on("reveal-reset", () => {
      console.log("[REVEAL] Reset");
      setCurrentRevealChain(0);
      setCurrentRevealStep(0);
      setIsRevealing(false);
    });

    return () => {
      newSocket.close();
    };
  }, []);
};
