const K_FACTOR = 32;

function calculateExpected(ratingA, ratingB) {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

function calculateNewRatings(ratingA, ratingB, result) {
  const expectedA = calculateExpected(ratingA, ratingB);
  const expectedB = calculateExpected(ratingB, ratingA);

  const newRatingA = Math.round(ratingA + K_FACTOR * (result - expectedA));
  const newRatingB = Math.round(ratingB + K_FACTOR * ((1 - result) - expectedB));

  return {
    playerA: { oldRating: ratingA, newRating: newRatingA, change: newRatingA - ratingA },
    playerB: { oldRating: ratingB, newRating: newRatingB, change: newRatingB - ratingB }
  };
}

module.exports = { calculateExpected, calculateNewRatings };
