import React from "react";
import { toast } from "react-toastify";
import GameMenu from "../components/game/GameMenu";
import GameLobby from "../components/game/GameLobby";
import GameTask from "../components/game/GameTask";
import GameResults from "../components/game/GameResults";
import RoundTransition from "../components/game/RoundTransition";
import ArtJamCanvas from "../components/ArtJamCanvas";
import { useGameManager } from "../hooks/useGameManager";

const Game = () => {
  const game = useGameManager();

  const copyGameCode = () => {
    navigator.clipboard.writeText(game.currentGame?.code || game.gameCode);
    toast.success("Game code copied!");
  };

  if (game.gameState === "menu") {
    return (
      <GameMenu
        nickname={game.nickname}
        setNickname={game.setNickname}
        gameCode={game.gameCode}
        setGameCode={game.setGameCode}
        maxPlayers={game.maxPlayers}
        setMaxPlayers={game.setMaxPlayers}
        gameMode={game.gameMode}
        setGameMode={game.setGameMode}
        timeLimit={game.timeLimit}
        setTimeLimit={game.setTimeLimit}
        drawTime={game.drawTime}
        setDrawTime={game.setDrawTime}
        handleCreateGame={game.createGame}
        handleJoinGame={game.joinGame}
      />
    );
  }

  if (game.gameState === "lobby") {
    return (
      <GameLobby
        currentGame={game.currentGame}
        nickname={game.nickname}
        copyGameCode={copyGameCode}
        handleStartGame={game.startGame}
        handleLeaveRoom={game.leaveGame}
      />
    );
  }

  if (game.gameState === "task") {
    if (game.currentGame?.gameMode === "art-jam") {
      return (
        <ArtJamCanvas
          jamCode={game.currentGame.code}
          nickname={game.nickname}
          userId={game.user?._id} // Assuming user is available in game object or context
          onLeave={game.leaveGame}
          timeLimit={game.currentGame.timeLimit}
        />
      );
    }

    return (
      <>
        {game.isTransitioning && (
          <RoundTransition
            round={game.nextRoundNumber}
            totalRounds={game.currentGame?.totalRounds}
          />
        )}
        <GameTask
          currentTask={game.currentTask}
          currentRound={game.currentRound}
          currentGame={game.currentGame}
          nickname={game.nickname}
          promptText={game.promptText}
          setPromptText={game.setPromptText}
          hasSubmitted={game.hasSubmitted}
          handleSubmitTask={game.submitTask}
          submittedCount={game.submittedCount}
          totalPlayers={game.totalPlayers}
          handleLeaveGame={game.leaveGame}
        />
      </>
    );
  }

  if (game.gameState === "results") {
    return (
      <GameResults
        currentGame={game.currentGame}
        nickname={game.nickname}
        chains={game.chains}
        isRevealing={game.isRevealing}
        currentRevealChain={game.currentRevealChain}
        currentRevealStep={game.currentRevealStep}
        socket={game.socket}
        setIsRevealing={game.setIsRevealing}
        setCurrentRevealChain={game.setCurrentRevealChain}
        setCurrentRevealStep={game.setCurrentRevealStep}
        handleRevealNext={game.revealNext}
        handleRevealReset={game.revealReset}
        handleRepostToFeed={game.repostToFeed}
        handlePlayAgain={game.playAgain}
        setGameState={game.setGameState}
        setCurrentGame={game.setCurrentGame}
        setDrawings={game.setDrawings}
        setChains={game.setChains}
        setCurrentRound={game.setCurrentRound}
        setCurrentTask={game.setCurrentTask}
        setHasSubmitted={game.setHasSubmitted}
      />
    );
  }

  return null;
};

export default Game;
