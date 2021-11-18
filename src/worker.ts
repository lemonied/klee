import {
  workerData,
  parentPort,
} from 'worker_threads';
import { cutPicture, grayscale, textureCompare } from './utils/math';
import { SharedWorkerData } from './models';
import { Bitmap } from '@jimp/core';

const shared = workerData as SharedWorkerData[];

const onMessage = (bitmap: Bitmap) => {
  for (let i = 0; i < shared.length; i++) {
    const v = shared[i];
    const currentRGB = cutPicture(v.crop, bitmap);
    const currentGrayscale = grayscale(currentRGB);
    const similarity = textureCompare(v.crop.grayscale!, currentGrayscale);
    console.log(similarity);
  }
};

parentPort?.on('message', onMessage);
