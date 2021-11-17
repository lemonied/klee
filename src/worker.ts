import {
  Worker,
  workerData,
} from 'worker_threads';
import { jimpScreenShot } from './picture';

const data = workerData as any[];

const eventLoop = () => {
  const snapshot = jimpScreenShot();

};
