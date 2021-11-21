import { SnapshotItem, ProcessItem, SharedWorkerData, CropData } from './models';
import { elseIfPassed, nextTick, randomStr, setIn, sleep, Token } from './utils/utils';
import { centralEventbus } from './utils/eventbus';
import { getBuffer, screenshot } from './picture';
import ioHook from 'iohook';
import robot from 'robotjs';
import { Worker } from 'worker_threads';
import { resolve } from 'path';

class Processor {
  SNAPSHOT_HISTORY: SnapshotItem[] = [];
  PROCESS_LIST: ProcessItem[] = [];
  SECONDARY_LIST: ProcessItem[] = [];
  sharedWorkerData: SharedWorkerData[] = [];
  config = {
    type: 'press',
    button: 5,
    workerDelay: 500,
  };
  logAble = false;
  private MAX_HISTORY_SIZE = 6;
  private processCancelToken: (() => void) | null = null;
  private workerCancelToken: (() => void) | null = null;
  private worker?: Worker;
  private workerStop = false;
  private secondaryWorker?: Worker;
  private secondaryWorkerToken?: Token<void>;
  private DOWN_KEYS = new Set<string>();
  constructor() {
    ioHook.on('mousedown', (e) => {
      // 侧键2 -> 5, 侧键1 -> 4, 左键 -> 1, 右键 -> 2
      if (e.button === this.config.button) {
        if (this.config.type === 'press') {
          this.startProcessLoop();
        } else {
          this.toggleProgress();
        }
      }
    });
    ioHook.on('mouseup', (e) => {
      // 侧键2 -> 5, 侧键1 -> 4, 左键 -> 1, 右键 -> 2
      if (this.config.type === 'press' && e.button === this.config.button) {
        this.cancelProcess();
      }
    });
  }
  log(data: any) {
    if (this.logAble) {
      centralEventbus.emit('log', data);
    }
  }
  keyToggle(key: string, behavior: 'down' | 'up') {
    robot.keyToggle(key, behavior);
    if (behavior === 'down') {
      this.DOWN_KEYS.add(key);
    } else {
      this.DOWN_KEYS.delete(key);
    }
  }
  clearKeys() {
    this.DOWN_KEYS.forEach(value => {
      robot.keyToggle(value, 'up');
    });
    this.DOWN_KEYS.clear();
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
        timestamp: item.timestamp,
        base64: item.dataURL,
      };
    }));
  };
  // 保存主流程列表
  setProcessList(value: ProcessItem[]) {
    this.PROCESS_LIST = value;
    this.formatProcessList();
  };
  // 保存副流程列表
  setSecondaryList(value: ProcessItem[]) {
    this.SECONDARY_LIST = value;
  }
  // 开启流程监听
  setAndStartListen(value: { mainProcess: ProcessItem[]; secondaryProcess: ProcessItem[]; }) {
    this.setProcessList(value.mainProcess);
    this.setSecondaryList(value.secondaryProcess);
    this.startMouseListener();
  }

  screenshot() {
    const bitmap = screenshot();
    const buffer = getBuffer(bitmap);
    const ret = {
      id: randomStr(),
      timestamp: Date.now(),
      bitmap,
      buffer,
      dataURL: `data:image/png;base64,${buffer.toString('base64')}`,
    };
    this.addHistory(ret);
    return ret;
  }
  // 保存流程后格式化流程
  formatProcessList() {
    this.sharedWorkerData = [];
    const loop = (list: ProcessItem[], keyPath: Array<number | string> = []) => {
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
          loop(v.children, [...keyPath, i, 'children']);
        }
      }
    };
    loop(this.PROCESS_LIST);
  }

  // 开始鼠标监听
  startMouseListener() {
    this.setWorkerProcess();
    this.setSecondaryProcess();
    ioHook.start();
  }
  // 退出鼠标监听
  async cancelMouseListener() {
    await Promise.all([
      this.worker?.terminate(),
      this.secondaryWorker?.terminate(),
    ]);
    this.worker = undefined;
    this.secondaryWorker = undefined;
    this.secondaryWorkerToken = undefined;
    this.cancelProcess();
    ioHook.stop();
  }

  // 开启流程循环
  startProcessLoop() {
    this.cancelProcess();
    this.processCancelToken = this.startProgress();
    this.workerCancelToken = this.startWorkerProcess();
  }
  // 退出流程循环
  cancelProcess() {
    if (typeof this.processCancelToken ==='function') {
      this.processCancelToken();
      this.processCancelToken = null;
    }
    if (typeof this.workerCancelToken ==='function') {
      this.workerCancelToken();
      this.workerCancelToken = null;
    }
    this.clearKeys();
  }
  // 开启/关闭流程循环
  toggleProgress() {
    if (this.processCancelToken || this.workerCancelToken) {
      this.cancelProcess();
    } else {
      this.startProcessLoop();
    }
  }

  // 开始流程循环
  startProgress() {
    let stop: boolean | null = false;
    let cancel: (() => void) | null = null;
    const loop = async (list: ProcessItem[]) => {
      if (stop) throw 'loop stop';
      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        const last = list[i - 1];
        if (!elseIfPassed(v, last)) {
          continue;
        }
        if (v.type === 'general' && v.key) {
          await sleep(v.keydown, c => cancel = c);
          if (v.keyup > 0) {
            this.keyToggle(v.key, 'down');
            await sleep(v.keyup, c => cancel = c);
            this.keyToggle(v.key, 'up');
          } else {
            robot.keyTap(v.key);
          }
        } else if (v.type === 'picker') {
          if (v.passed) {
            await loop(v.children);
          }
        } else if (v.type === 'timeout') {
          await sleep(v.value, c => cancel = c);
        }
      }
      await nextTick();
    };
    const timeout = () => {
      loop(this.PROCESS_LIST).then(timeout).catch(error => {
        // stop
        this.log(error);
        cancel = null;
        stop = null;
      });
    };
    if (this.PROCESS_LIST.length) {
      timeout();
      this.log('start process');
    }
    return () => {
      stop = true;
      typeof cancel === 'function' && cancel();
    };
  }
  // 图像分析循环
  startWorkerProcess() {
    let cancel: (() => void) | null = null;
    const workerLoop = async () => {
      if (this.workerStop) {
        throw 'worker stop';
      }
      const shot = screenshot();
      this.worker?.postMessage(shot);
      this.secondaryWorker?.postMessage(shot);
      if (this.secondaryWorkerToken) {
        await this.secondaryWorkerToken?.promise;
        this.secondaryWorkerToken = new Token<void>();
      }
      await sleep(this.config.workerDelay, c => cancel = c);
    };
    const timeout = () => {
      workerLoop().then(timeout).catch(() => {
        cancel = null;
        this.log('worker stop');
      });
    };
    if (this.sharedWorkerData.length || this.SECONDARY_LIST.length) {
      this.log('worker start');
      this.workerStop = false;
      timeout();
    }
    return () => {
      this.workerStop = true;
      typeof cancel === 'function' && cancel();
    };
  }
  // 开启多线程解析图像
  setWorkerProcess() {
   if (this.sharedWorkerData.length) {
     this.worker = new Worker(resolve(__dirname, './worker.js'), {
       workerData: this.sharedWorkerData,
     });
     this.worker.on('message', (e) => {
       setIn(this.PROCESS_LIST, [...e.keyPath, 'passed'], e.result);
       this.log(e);
     });
   }
  }
  // 开启副线程（副流程）worker
  setSecondaryProcess() {
    if (this.SECONDARY_LIST.length) {
      this.secondaryWorker = new Worker(resolve(__dirname, './secondary-worker.js'), {
        workerData: this.SECONDARY_LIST,
      });
      this.secondaryWorker.on('message', (e) => {
        if (e.type === 'finish') {
          this.secondaryWorkerToken?.resolve();
        } else if (e.type === 'keyToggle' && !this.workerStop) {
          this.keyToggle(e.key, e.behavior);
        } else if (e.type === 'keyTap' && !this.workerStop) {
          robot.keyTap(e.key);
        }
      });
      this.secondaryWorkerToken = new Token<void>();
    }
  }
}

export const processor = new Processor();
