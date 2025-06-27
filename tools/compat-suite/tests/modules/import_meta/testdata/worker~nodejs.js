import { parentPort } from 'node:worker_threads';

parentPort.once('message', (data) => {
  parentPort.postMessage(data / 2);
});
