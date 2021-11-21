import { SnapshotItem, ProcessItem, SharedWorkerData, CropData } from './models';
import { nextTick, randomStr, setIn, sleep } from './utils/utils';
import { centralEventbus } from './utils/eventbus';
import { getBuffer, screenshot } from './picture';
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
  workerCancelToken: (() => void) | null = null;
  config = {
    type: 'press',
    button: 5,
    workerDelay: 500,
  };
  worker?: Worker;
  logAble = false;
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
  // 保存流程列表
  setProcessList(value: any[]) {
    this.PROCESS_LIST = value;
    this.formatProcessList();
  };
  // 开启流程监听
  setAndStartListen(value: any[]) {
    this.setProcessList(value);
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
    ioHook.start();
  }
  // 退出鼠标监听
  async cancelMouseListener() {
    await this.worker?.terminate();
    this.worker = undefined;
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
  }
  // 开启/关闭流程循环
  toggleProgress() {
    if (this.processCancelToken || this.workerCancelToken) {
      this.cancelProcess();
    } else {
      this.startProcessLoop();
    }
  }

  // 一般流程循环
  startProgress() {
    let stop: boolean | null = false;
    let cancel: (() => void) | null = null;
    const loop = async (list: ProcessItem[]) => {
      if (stop) throw 'loop stop';
      for (let i = 0; i < list.length; i++) {
        const v = list[i];
        const last = list[i - 1];
        if (
          last?.type === 'picker' && last.otherwise
        ) {
          if (last.skip || last.passed) {
            if (v.type === 'picker' && v.otherwise) {
              v.skip = true;
            }
            continue;
          } else if (v.type === 'picker' && v.otherwise) {
            v.skip = false;
          }
        }
        if (v.type === 'general' && v.key) {
          await sleep(v.keydown, c => cancel = c);
          if (v.keyup > 0) {
            robot.keyToggle(v.key, 'down');
            try {
              await sleep(v.keyup, c => cancel = c);
              robot.keyToggle(v.key, 'up');
            } catch (e) {
              robot.keyToggle(v.key, 'up');
              throw e;
            }
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
    timeout();
    this.log('start process');
    return () => {
      stop = true;
      typeof cancel === 'function' && cancel();
    };
  }
  // 图像分析循环
  startWorkerProcess() {
    let cancel: (() => void) | null = null;
    const workerLoop = async () => {
      const shot = screenshot();
      this.worker?.postMessage(shot);
      await sleep(this.config.workerDelay, c => cancel = c);
    };
    this.log('worker start');
    const timeout = () => {
      workerLoop().then(timeout).catch(() => {
        cancel = null;
        this.log('worker stop');
      });
    };
    if (this.sharedWorkerData.length) {
      timeout();
    }
    return () => {
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
}

export const processor = new Processor();
