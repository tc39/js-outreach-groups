import './url.web_worker.test.js';

test('NOTE: Using the <code>node:worker_threads</code> API', async () => {
  const { Worker } = await import('node:worker_threads');
  const worker = new Worker(
    new URL('./testdata/worker~nodejs.js', import.meta.url),
  );
  try {
    const n = 42;
    const resp = await Promise.race([
      new Promise((resolve, reject) => {
        worker.once('error', reject);
        worker.once('message', resolve);

        worker.postMessage(n);
      }),
      new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('No response from worker after timeout'));
        }, 5000);
      }),
    ]);
    expect(resp).toBe(21);
  } finally {
    worker.terminate();
  }
});
