import {
  workerData,
  parentPort,
} from 'worker_threads';
import { cutPicture, grayscale, lightness, textureCompare } from './utils/math';
import { SharedWorkerData } from './models';
import { Bitmap } from '@jimp/core';

const shared = workerData as SharedWorkerData[];

const onMessage = (bitmap: Bitmap) => {
  for (let i = 0; i < shared.length; i++) {
    const v = shared[i];
    parentPort?.postMessage({
      keyPath: [...v.keyPath, 'passed'],
      result: v.conditions.every(condition => {
        const currentRGB = cutPicture(v.crop, bitmap);
        if (condition.type === 'texture') {
          const currentGrayscale = grayscale(currentRGB);
          const similarity = 100 - Math.min(textureCompare(v.crop.grayscale!, currentGrayscale), 100);
          return condition.size === 'more' ?
            similarity > condition.value :
            similarity < condition.value;
        } else if (condition.type === 'lightness') {
          const light = lightness(currentRGB);
          return condition.size === 'more' ?
            light > condition.value :
            light < condition.value;
        }
        return false;
      }),
    });
  }
};

parentPort?.on('message', onMessage);
