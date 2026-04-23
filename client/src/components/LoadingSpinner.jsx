import styles from '../styles/Components.module.css';

function LoadingSpinner() {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
    </div>
  );
}

export default LoadingSpinner;
