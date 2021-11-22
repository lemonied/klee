import {
  workerData,
  parentPort,
} from 'worker_threads';
import { Bitmap, SharedWorkerData } from './models';
import { getImageResult } from './utils/utils';

const shared = workerData as SharedWorkerData[];

const onMessage = (bitmap: Bitmap) => {
  for (let i = 0; i < shared.length; i++) {
    const v = shared[i];
    const result = getImageResult(v.conditions, v.crop, bitmap, v.area);
    parentPort?.postMessage({
      keyPath: v.keyPath,
      result: result.every(v => v.passed),
      value: result.map(v => v.value),
    });
  }
};

parentPort?.on('message', onMessage);
