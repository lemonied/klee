import {
  workerData,
  parentPort,
} from 'worker_threads';
import { Bitmap, ProcessItem } from './models';
import { elseIfPassed, getImageResult, nextTick, sleep } from './utils/utils';

const shared = workerData as ProcessItem[];

const onMessage = async (bitmap: Bitmap) => {
  const loop = async (list: ProcessItem[]) => {
    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      const last = list[i - 1];
      if (!elseIfPassed(v, last)) {
        continue;
      }
      if (v.type === 'general' && v.key) {
        await sleep(v.keydown);
        if (v.keyup > 0) {
          parentPort?.postMessage({
            type: 'keyToggle',
            key: v.key,
            behavior: 'down',
          });
          await sleep(v.keyup);
          parentPort?.postMessage({
            type: 'keyToggle',
            key: v.key,
            behavior: 'up',
          });
        } else {
          parentPort?.postMessage({
            type: 'keyTap',
            key: v.key,
          });
        }
      } else if (v.type === 'picker') {
        v.passed = getImageResult(v.conditions, v.crop!, bitmap).every(v => v.passed);
        if (v.passed) {
          await loop(v.children);
        }
      } else if (v.type === 'timeout') {
        await sleep(v.value);
      }
    }
    await nextTick();
  };
  await loop(shared);
  parentPort?.postMessage({ type: 'finish' });
};

parentPort?.on('message', onMessage);
