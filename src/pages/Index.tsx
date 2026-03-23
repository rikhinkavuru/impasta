import { useGame } from '@/hooks/useGame';
import HomeScreen from '@/components/game/HomeScreen';
import LobbyScreen from '@/components/game/LobbyScreen';
import RoleRevealScreen from '@/components/game/RoleRevealScreen';
import CluePhaseScreen from '@/components/game/CluePhaseScreen';
import VotingScreen from '@/components/game/VotingScreen';
import ResultsScreen from '@/components/game/ResultsScreen';

export default function Index() {
  const {
    game, players, sessionScores, currentPlayer, isHost, loading, error,
    createGame, joinGame, startGame, proceedToClues, submitClue, submitVote, playAgain,
    updateSettings, setError,
  } = useGame();

  if (!game || !currentPlayer) {
    return (
      <HomeScreen
        onCreateGame={createGame}
        onJoinGame={joinGame}
        loading={loading}
        error={error}
        clearError={() => setError(null)}
      />
    );
  }

  switch (game.phase) {
    case 'lobby':
      return (
        <LobbyScreen
          game={game}
          players={players}
          isHost={isHost}
          onStartGame={startGame}
          onUpdateSettings={updateSettings}
        />
      );
    case 'role_reveal':
      return (
        <RoleRevealScreen
          game={game}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onProceed={proceedToClues}
        />
      );
    case 'clue_giving':
      return (
        <CluePhaseScreen
          game={game}
          players={players}
          currentPlayer={currentPlayer}
          onSubmitClue={submitClue}
        />
      );
    case 'voting':
      return (
        <VotingScreen
          players={players}
          currentPlayer={currentPlayer}
          onVote={submitVote}
        />
      );
    case 'results':
      return (
        <ResultsScreen
          game={game}
          players={players}
          sessionScores={sessionScores}
          currentPlayer={currentPlayer}
          isHost={isHost}
          onPlayAgain={playAgain}
        />
      );
    default:
      return null;
  }
}
