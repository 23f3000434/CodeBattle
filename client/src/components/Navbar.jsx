import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RatingBadge from './RatingBadge';
import styles from '../styles/Navbar.module.css';

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.container}>
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>&#9876;</span>
          CodeBattle
        </Link>

        <div className={styles.links}>
          <Link to="/leaderboard" className={styles.navLink}>Leaderboard</Link>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className={styles.navLink}>Dashboard</Link>
              <Link to="/profile" className={styles.navLink}>
                {user.username} <RatingBadge rating={user.rating} inline />
              </Link>
              <button onClick={handleLogout} className={styles.logoutBtn}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className={styles.navLink}>Login</Link>
              <Link to="/register" className={styles.registerBtn}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
