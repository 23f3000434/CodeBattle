import styles from '../styles/Components.module.css';

function getRatingTier(rating) {
  if (rating >= 1800) return { label: 'Master', className: styles.ratingGold };
  if (rating >= 1500) return { label: 'Expert', className: styles.ratingSilver };
  if (rating >= 1200) return { label: 'Intermediate', className: styles.ratingBronze };
  return { label: 'Beginner', className: styles.ratingIron };
}

function RatingBadge({ rating, inline = false }) {
  const tier = getRatingTier(rating);

  return (
    <span className={`${styles.ratingBadge} ${tier.className} ${inline ? styles.ratingInline : ''}`}>
      {rating}
    </span>
  );
}

export default RatingBadge;
