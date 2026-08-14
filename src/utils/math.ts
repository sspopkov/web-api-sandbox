export function countPrimes(limit: number) {
  let count = 0;
  for (let value = 2; value <= limit; value += 1) {
    let prime = true;
    const root = Math.sqrt(value);
    for (let divisor = 2; divisor <= root; divisor += 1) {
      if (value % divisor === 0) {
        prime = false;
        break;
      }
    }
    if (prime) {
      count += 1;
    }
  }
  return count;
}
