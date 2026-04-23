import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/Landing.module.css';

function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className={styles.landing}>
      <section className={styles.hero}>
        <h1 className={styles.title}>CodeBattle</h1>
        <p className={styles.tagline}>Real-time competitive coding. Head to head.</p>
        <p className={styles.subtitle}>
          Solve coding challenges against real opponents in real-time.
          Climb the ranks with ELO-based matchmaking.
        </p>
        <div className={styles.cta}>
          {isAuthenticated ? (
            <Link to="/dashboard" className={styles.primaryBtn}>Go to Dashboard</Link>
          ) : (
            <Link to="/register" className={styles.primaryBtn}>Get Started</Link>
          )}
          <Link to="/leaderboard" className={styles.secondaryBtn}>View Leaderboard</Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>&#9889;</div>
          <h3>Real-time Battles</h3>
          <p>Race against opponents to solve the same problem. See their progress live.</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>&#9878;</div>
          <h3>ELO Rating</h3>
          <p>Competitive rating system that matches you with players of similar skill.</p>
        </div>
        <div className={styles.featureCard}>
          <div className={styles.featureIcon}>&#128221;</div>
          <h3>Curated Problems</h3>
          <p>From easy warm-ups to tricky challenges. Test your problem-solving under pressure.</p>
        </div>
      </section>
    </div>
  );
}

export default Landing;
