import { SnapshotItem, ProcessItem, SharedWorkerData, CropData } from './models';
import { nextTick, randomStr, setIn, sleep } from './utils/utils';
import { centralEventbus } from './utils/eventbus';
import { jimpScreenShot } from './picture';
import ioHook from 'iohook';
import robot from 'robotjs';
import { Worker } from 'worker_threads';
import { resolve } from 'path';

class Processor {
  MAX_HISTORY_SIZE = 6;
  SNAPSHOT_HISTORY: SnapshotItem[] = [];
  PROCESS_LIST: ProcessItem[] = [];
  sharedWorkerData: SharedWorkerData[] = [];
  processCancelToken: (() => void) | null = null;
  cancelChildProcess: (() => Promise<void>) | null = null;
  listenerConfig = {
    type: 'press',
    button: 5,
    workerDelay: 800,
  };
  constructor() {
    ioHook.on('mousedown', (e) => {
      // 侧键2 -> 5, 侧键1 -> 4, 左键 -> 1, 右键 -> 2
      if (e.button === this.listenerConfig.button) {
        if (this.listenerConfig.type === 'press') {
          this.cancelProcess();
          this.processCancelToken = this.startProgress();
        } else {
          this.toggleProgress();
        }
      }
    });
    ioHook.on('mouseup', (e) => {
      // 侧键2 -> 5, 侧键1 -> 4, 左键 -> 1, 右键 -> 2
      if (this.listenerConfig.type === 'press' && e.button === this.listenerConfig.button) {
        this.cancelProcess();
      }
    });
  }
  getHistory(crop: CropData) {
    if (crop.id) {
      return this.SNAPSHOT_HISTORY.find(v => v.id === crop.id) || null;
    }
    return null;
  };
  addHistory(value: SnapshotItem) {
    this.SNAPSHOT_HISTORY.push(value);
    if (this.SNAPSHOT_HISTORY.length > this.MAX_HISTORY_SIZE) {
      this.SNAPSHOT_HISTORY.shift();
    }
    centralEventbus.emit('history', this.SNAPSHOT_HISTORY.map((item) => {
      return {
        id: item.id,
        base64: item.buffer.toString('base64'),
      };
    }));
  };
  setProcessList(value: any[]) {
    this.PROCESS_LIST = value;
    this.handleProcessList();
  };
  async startProcessList(value: any[]) {
    this.setProcessList(value);
    await this.startMouseListener();
  };
  async screenshot() {
    const jimp = jimpScreenShot();
    const buffer = await jimp.getBufferAsync('image/png');
    const ret = {
      id: randomStr(),
      timestamp: Date.now(),
      jimp,
      buffer,
      dataURL: `data:image/png;base64,${buffer.toString('base64')}`,
    };
    this.addHistory(ret);
    return ret;
  }
  handleProcessList() {
    this.sharedWorkerData = [];
    const loop = (list: ProcessItem[], keyPath: number[] = []) => {
      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        if (v.type === 'picker') {
          if (v.crop && v.crop.id) {
            this.sharedWorkerData.push({
              keyPath: [...keyPath, i],
              crop: v.crop,
              conditions: v.conditions,
            });
          }
          loop(v.children, [...keyPath, i]);
        }
      }
    };
    loop(this.PROCESS_LIST);
  }

  async startMouseListener() {
    if (typeof this.cancelChildProcess === 'function') {
      await this.cancelChildProcess();
      this.cancelChildProcess = null;
    }
    this.cancelChildProcess = this.startWorkerProcess();
    this.listenerConfig.button = 5;
    ioHook.start();
  }

  async cancelMouseListener() {
    if (typeof this.cancelChildProcess === 'function') {
      await this.cancelChildProcess();
      this.cancelChildProcess = null;
    }
    ioHook.stop();
    this.cancelProcess();
  }

  cancelProcess() {
    if (typeof this.processCancelToken ==='function') {
      this.processCancelToken();
      this.processCancelToken = null;
    }
  }

  toggleProgress() {
    if (typeof this.processCancelToken ==='function') {
      this.processCancelToken();
      this.processCancelToken = null;
    } else {
      this.processCancelToken = this.startProgress();
    }
  }

  startProgress() {
    let token: {
      stop: boolean;
      cancel: null | (() => void);
    } | null = {
      stop: false,
      cancel: null,
    };
    const loop = async (list: ProcessItem[]) => {
      if (token!.stop) throw 'loop stop';
      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        const last = list[i - 1];
        if (last && last.type === 'picker' && last.otherwise && last.passed) {
          continue;
        }
        if (v.type === 'general' && v.key) {
          await sleep(v.keydown, c => token!.cancel = c);
          robot.keyToggle(v.key, 'down');
          try {
            await sleep(v.keyup, c => token!.cancel = c);
            robot.keyToggle(v.key, 'up');
          } catch (e) {
            robot.keyToggle(v.key, 'up');
            throw e;
          }
        } else if (v.type === 'picker') {
          if (v.passed) {
            await loop(v.children);
          }
        } else if (v.type === 'timeout') {
          await sleep(v.value, c => token!.cancel = c);
        }
      }
      await nextTick();
    };
    const timeout = () => {
      loop(this.PROCESS_LIST).then(timeout).catch(error => {
        // stop
        if (process.env.NODE_ENV === 'development') {
          console.log(error);
        }
        token = null;
      });
    };
    timeout();
    if (process.env.NODE_ENV === 'development') {
      console.log('start process');
    }
    return () => {
      token!.stop = true;
      typeof token!.cancel === 'function' && token!.cancel();
    };
  }

  startWorkerProcess() {
    let sharedWorkerToken: {
      worker?: Worker;
      cancel?: (() => void) | null;
    } | null = {};
    if (this.sharedWorkerData.length) {
      const workerLoop = async () => {
        const shot = jimpScreenShot();
        sharedWorkerToken?.worker?.postMessage(shot.bitmap);
        await sleep(this.listenerConfig.workerDelay, c => sharedWorkerToken!.cancel = c);
      };
      sharedWorkerToken.worker = new Worker(resolve(__dirname, './worker.js'), {
        workerData: this.sharedWorkerData,
      });
      sharedWorkerToken.worker.on('message', (e) => {
        setIn(this.PROCESS_LIST, e.keyPath, e.result);
      });
      if (process.env.NODE_ENV === 'development') {
        console.log('worker start');
      }
      const timeout = () => {
        workerLoop().then(timeout).catch(() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('worker end');
          }
        });
      };
      timeout();
    }
    return async () => {
      typeof sharedWorkerToken!.cancel === 'function' && sharedWorkerToken!.cancel();
      await sharedWorkerToken?.worker?.terminate()
      sharedWorkerToken = null;
      if (process.env.NODE_ENV === 'development') {
        console.log('worker terminate');
      }
    };
  }
}

export const processor = new Processor();
