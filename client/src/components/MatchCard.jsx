import { useAuth } from '../context/AuthContext';
import styles from '../styles/Components.module.css';

function MatchCard({ match }) {
  const { user } = useAuth();

  const isPlayer1 = match.players[0]?.user?._id === user._id;
  const me = isPlayer1 ? match.players[0] : match.players[1];
  const opponent = isPlayer1 ? match.players[1] : match.players[0];

  const myRatingChange = match.ratingChanges?.find(
    rc => rc.user?.toString() === user._id || rc.user === user._id
  );

  const isWinner = match.winner && (
    match.winner === user._id || match.winner._id === user._id
  );
  const isDraw = !match.winner;

  let resultLabel, resultClass;
  if (isDraw) {
    resultLabel = 'DRAW';
    resultClass = styles.resultDraw;
  } else if (isWinner) {
    resultLabel = 'WIN';
    resultClass = styles.resultWin;
  } else {
    resultLabel = 'LOSS';
    resultClass = styles.resultLoss;
  }

  return (
    <div className={styles.matchCard}>
      <div className={styles.matchResult}>
        <span className={`${styles.resultBadge} ${resultClass}`}>{resultLabel}</span>
        {myRatingChange && (
          <span className={myRatingChange.change >= 0 ? styles.ratingUp : styles.ratingDown}>
            {myRatingChange.change >= 0 ? '+' : ''}{myRatingChange.change}
          </span>
        )}
      </div>
      <div className={styles.matchInfo}>
        <span className={styles.matchProblem}>
          {match.problem?.title || 'Unknown Problem'}
        </span>
        <span className={styles.matchOpponent}>
          vs {opponent?.user?.username || 'Unknown'}
        </span>
      </div>
      <div className={styles.matchMeta}>
        <span>{me?.passedTests}/{me?.totalTests} tests</span>
        <span>{new Date(match.endedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

export default MatchCard;
