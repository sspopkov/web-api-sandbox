import { countPrimes } from '../utils/math';

self.onmessage = (event: MessageEvent<{ limit: number }>) => {
  const start = performance.now();
  const count = countPrimes(event.data.limit);
  self.postMessage({ count, duration: performance.now() - start });
};
