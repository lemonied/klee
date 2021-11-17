import {
  workerData,
} from 'worker_threads';
import { cutPicture, jimpScreenShot } from './picture';
import { SharedWorkerData } from './models';

const data = workerData as {
  timeout: number;
  shared: SharedWorkerData[];
};

const eventLoop = () => {
  const snapshot = jimpScreenShot();
  const shared = data.shared;
  for (let i = 0; i < shared.length; i++) {
    const v = shared[i];
    const currentRGB = cutPicture(v.crop, snapshot.bitmap);
  }
};
