import { CropData, SnapshotItem, ProcessItem } from './models';
import { average, nextTick, randomStr, sleep } from './utils';
import { centralEventBus } from './event-bus';
import { cutPicture, grayscale, jimpScreenShot, rgb2hsv } from './picture';
import ioHook from 'iohook';
import robot from 'robotjs';

const MAX_HISTORY_SIZE = 6;
const SNAPSHOT_HISTORY: SnapshotItem[] = [];
let SNAPSHOT_SELECTED: SnapshotItem[] = [];
let PROCESS_LIST: ProcessItem[] = [];

// 添加一个截图历史记录
const addHistory = (value: SnapshotItem) => {
  SNAPSHOT_HISTORY.push(value);
  if (SNAPSHOT_HISTORY.length > MAX_HISTORY_SIZE) {
    SNAPSHOT_HISTORY.shift();
  }
  centralEventBus.emit('history', SNAPSHOT_HISTORY.map((item) => {
    return {
      id: item.id,
      base64: item.buffer.toString('base64'),
    };
  }));
};
// 选择截图完成后保存选择记录
export const addSelected = (value: CropData) => {
  const history = SNAPSHOT_HISTORY.find(v => v.id === value.id);
  if (history) {
    SNAPSHOT_SELECTED.push(history);
    return history;
  }
  return null;
};
// 设置流程
export const setProcessList = (value: any[]) => {
  PROCESS_LIST = value;
  handleProcessList();
};
// 设置并开启流程
export const startProcessList = (value: any[]) => {
  setProcessList(value);
  startMouseListener();
};

export async function screenshot() {
  const jimp = jimpScreenShot();
  const buffer = await jimp.getBufferAsync('image/png');
  const ret = {
    id: randomStr(),
    timestamp: Date.now(),
    jimp,
    buffer,
    dataURL: `data:image/png;base64,${buffer.toString('base64')}`,
  };
  addHistory(ret);
  return ret;
}

export function handleProcessList() {
  const ids: string[] = [];
  const loop = (list: ProcessItem[]) => {
    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      if (v.type === 'picker' && v.crop && !v.rgb) {
        ids.push(v.crop.id);
        const image = SNAPSHOT_SELECTED.find(img => v.crop!.id && v.crop!.id === img.id);
        if (image) {
          const rgb = cutPicture(v.crop, image.jimp.bitmap);
          const hsv = rgb2hsv(rgb);
          v.rgb = rgb;
          v.grayscale = grayscale(rgb);
          v.hsv = hsv;
          v.lightness = average(hsv.map(light => light.v));
        }
      }
      loop(v.children);
    }
  };
  loop(PROCESS_LIST);
  SNAPSHOT_SELECTED = SNAPSHOT_SELECTED.filter(v => ids.includes(v.id));
}

// 流程循环控制
let processCancelToken: (() => void) | null = null;
let listenerConfig = {
  type: 'press',
  button: 5,
};
ioHook.on('mousedown', (e) => {
  // 侧键2 -> 5, 侧键1 -> 4, 左键 -> 1, 右键 -> 2
  if (e.button === listenerConfig.button) {
    if (listenerConfig.type === 'press') {
      cancelProcess();
      processCancelToken = startProgress();
    } else {
      toggleProgress();
    }
  }
});
ioHook.on('mouseup', (e) => {
  // 侧键2 -> 5, 侧键1 -> 4, 左键 -> 1, 右键 -> 2
  if (listenerConfig.type === 'press' && e.button === listenerConfig.button) {
    cancelProcess();
  }
});
// 开始鼠标事件监听
function startMouseListener() {
  listenerConfig.button = 5;
  ioHook.start();
}
// 退出鼠标事件监听
export function cancelMouseListener() {
  ioHook.stop();
  cancelProcess();
}
// 退出流程循环
function cancelProcess() {
  if (typeof processCancelToken ==='function') {
    processCancelToken();
    processCancelToken = null;
  }
}
function toggleProgress() {
  if (typeof processCancelToken ==='function') {
    processCancelToken();
    processCancelToken = null;
  } else {
    processCancelToken = startProgress();
  }
}
// 开始流程循环
function startProgress() {
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
      if (v.type === 'general' && v.key) {
        await sleep(v.keydown, c => token!.cancel = c);
        robot.keyToggle(v.key, 'down');
        await sleep(v.keyup, c => token!.cancel = c);
        robot.keyToggle(v.key, 'up');
      }
      await loop(v.children);
    }
    await nextTick();
  };
  const timeout = () => {
    loop(PROCESS_LIST).then(timeout).catch(error => {
      // stop
      if (process.env.NODE_ENV === 'development') {
        console.log(error);
      }
      token = null;
    });
  };
  timeout();
  return () => {
    token!.stop = true;
    typeof token!.cancel === 'function' && token!.cancel();
  };
}
