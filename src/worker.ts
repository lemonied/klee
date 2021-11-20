import {
  workerData,
  parentPort,
} from 'worker_threads';
import { absoluteCompare, cutPicture, grayscale, lightness, rgb2hsv, textureCompare } from './utils/math';
import { Bitmap, SharedWorkerData } from './models';

const shared = workerData as SharedWorkerData[];

const onMessage = (bitmap: Bitmap) => {
  for (let i = 0; i < shared.length; i++) {
    const v = shared[i];
    const result = v.conditions.map(condition => {
      const currentRGB = cutPicture(v.crop, bitmap);
      let passed = false;
      let value;
      if (condition.type === 'texture') {
        const currentGrayscale = grayscale(currentRGB);
        const similarity = value = textureCompare(v.crop.grayscale!, currentGrayscale);
        passed = condition.size === 'more' ?
          similarity > condition.value :
          similarity < condition.value;
      } else if (condition.type === 'lightness') {
        const light = value = lightness(currentRGB);
        passed = condition.size === 'more' ?
          light > condition.value :
          light < condition.value;
      } else if (condition.type === 'absolute') {
        const hsv = rgb2hsv(currentRGB);
        const absolute = value = absoluteCompare(v.crop.hsv!, hsv);
        passed = condition.size === 'more' ?
          absolute > condition.value :
          absolute < condition.value;
      }
      return { passed, value };
    });
    parentPort?.postMessage({
      keyPath: v.keyPath,
      result: result.every(v => v.passed),
      value: result.map(v => v.value),
    });
  }
};

parentPort?.on('message', onMessage);
