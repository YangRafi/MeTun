// Funkcja obliczająca datę wygaśnięcia legitymacji/weryfikacji
function getNextExpiryDate() {
  const now = new Date();
  const year = now.getMonth() < 3 ? now.getFullYear() : now.getMonth() < 10 ? now.getFullYear() : now.getFullYear() + 1;
  if (now.getMonth() < 3) return new Date(year, 2, 31, 23, 59, 59); // 31.03
  else return new Date(year, 9, 31, 23, 59, 59); // 31.10
}

module.exports = { getNextExpiryDate };