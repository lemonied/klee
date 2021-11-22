import { SnapshotItem, ProcessItem, SharedWorkerData, CropData } from './models';
import { elseIfPassed, nextTick$, randomStr, setIn } from './utils/utils';
import { centralEventbus } from './utils/eventbus';
import { getBuffer, screenshot } from './picture';
import ioHook from 'iohook';
import robot from 'robotjs';
import { Worker } from 'worker_threads';
import { resolve } from 'path';
import {
  map,
  mapTo,
  mergeMap,
  mergeMapTo,
  MonoTypeOperatorFunction,
  Observable,
  of,
  repeat,
  Subscription,
  tap,
  timer,
} from 'rxjs';

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
  private secondaryWorker?: Worker;
  private secondaryWorker$ = new Observable<void>(subscriber => {
    const onMessage = (e: any) => {
      if (e.type === 'finish') {
        subscriber.next();
      } else if (e.type === 'keyToggle') {
        this.keyToggle(e.key, e.behavior);
      } else if (e.type === 'keyTap') {
        robot.keyTap(e.key);
      } else if (e.type === 'log') {
        this.log(e.data);
      }
    };
    this.secondaryWorker?.on('message', onMessage);
    return {
      unsubscribe: () => {
        this.secondaryWorker?.off('message', onMessage);
        this.secondaryWorker?.postMessage({ type: 'shutdown' });
      },
    };
  });
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
              area: v.area,
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
    const $: MonoTypeOperatorFunction<{ list: ProcessItem[]; item: ProcessItem; index: number; }> = source => {
      return source.pipe(
        mergeMap(result => {
          const { item, list, index } = result;
          const last = list[index - 1];
          const next = list[index + 1];
          if (index < list.length - 1 && !elseIfPassed(item, last)) {
            return of({ item: next, list, index: index + 1 }).pipe($);
          }
          let next$: Observable<any> = of(null);
          if (item.type === 'general' && item.key) {
            next$ = timer(item.keydown);
            if (item.keyup > 0) {
              next$ = next$.pipe(
                mergeMap(() => {
                  this.keyToggle(item.key, 'down');
                  return timer(item.keyup);
                }),
                tap(() => {
                  this.keyToggle(item.key, 'up');
                }),
              );
            } else {
              robot.keyTap(item.key);
            }
          } else if (item.type === 'picker') {
            if (item.passed && item.children.length) {
              next$ = next$.pipe(mapTo({ list: item.children, item: item.children[0], index: 0 }), $);
            }
          } else if (item.type === 'timeout') {
            next$ = next$.pipe(mergeMapTo(timer(item.value)));
          }
          if (index < list.length - 1) {
            return next$.pipe(mergeMapTo(of({ item: next, list, index: index + 1 })), $);
          }
          return next$;
        }),
      );
    };
    let subscription: Subscription | undefined;
    if (this.PROCESS_LIST.length) {
      subscription = of({ list: this.PROCESS_LIST, index: 0, item: this.PROCESS_LIST[0] }).pipe(
        $,
        nextTick$(),
        repeat(),
      ).subscribe();
      this.log('start process');
    }
    return () => {
      subscription?.unsubscribe();
      subscription = undefined;
    };
  }
  // 图像分析循环
  startWorkerProcess() {
    const $ = of(null).pipe(
      map(() => screenshot()),
      tap(res => {
        this.worker?.postMessage(res);
        this.secondaryWorker?.postMessage({ type: 'screenshot', bitmap: res });
      }),
      mergeMap(() => {
        if (this.SECONDARY_LIST.length && this.secondaryWorker) {
          return this.secondaryWorker$;
        }
        return of(null);
      }),
      mergeMap(() => timer(this.config.workerDelay)),
      repeat(),
    );
    let subscription: Subscription | undefined;
    if (this.sharedWorkerData.length || this.SECONDARY_LIST.length) {
      this.log('worker start');
      subscription = $.subscribe();
    }
    return () => {
      subscription?.unsubscribe();
      subscription = undefined;
    };
  }
  // 开启多线程解析图像
  setWorkerProcess() {
   if (this.sharedWorkerData.length) {
     this.worker = new Worker(resolve(__dirname, './worker.js'), {
       workerData: this.sharedWorkerData,
     });
     this.worker.on('message', (e) => {
       if (e.type === 'normal') {
         setIn(this.PROCESS_LIST, [...e.keyPath, 'passed'], e.result);
         this.log(e);
       } else if (e.type === 'log') {
         this.log(e.data);
       }
     });
   }
  }
  // 开启副线程（副流程）worker
  setSecondaryProcess() {
    if (this.SECONDARY_LIST.length) {
      this.secondaryWorker = new Worker(resolve(__dirname, './secondary-worker.js'), {
        workerData: this.SECONDARY_LIST,
      });
    }
  }
}

export const processor = new Processor();
