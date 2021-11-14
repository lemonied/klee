import { CropData, RGB, SnapshotItem } from './models';
import screenShotDesktop from 'screenshot-desktop';
import { average, randomStr } from './utils';
import { centralEventBus } from './event-bus';
import { getImageData, getRGB, grayscale, rgb2hsv } from './picture';

const MAX_HISTORY_SIZE = 6;
const SNAPSHOT_HISTORY: SnapshotItem[] = [];
let SNAPSHOT_SELECTED: SnapshotItem[] = [];
let PROCESS_LIST: any[] = [];

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
// 框选完成后保存选择记录
export const addSelected = (value: CropData) => {
  const history = SNAPSHOT_HISTORY.find(v => v.id === value.id);
  if (history) {
    SNAPSHOT_SELECTED.push(history);
    return history;
  }
  return null;
};
// 设置流程
export const setProcessList = async (value: any[]) => {
  PROCESS_LIST = value;
  await handleProcessList();
};

/**
 * @description 全屏截图并返回图像信息
 * screen表示第n个屏幕，默认截取第一个
 */
export async function screenshot(screen?: number) {
  const ret = {
    id: randomStr(),
    buffer: await screenShotDesktop({ format: 'png', screen }),
  };
  addHistory(ret);
  return ret;
}

/**
 * @description 切割图片，宽高等分
 */
const CUT_WIDTH = 8;
const CUT_HEIGHT = 8;
export async function cutPicture(crop: CropData, image: string | Buffer, type = 'png') {
  const rgb: RGB[] = [];
  const nd = await getImageData(image, type);
  const perWidth = crop.width / CUT_WIDTH;
  const perHeight = crop.height / CUT_HEIGHT;
  for (let w = 0; w < CUT_WIDTH; w++) {
    for (let h = 0; h < CUT_HEIGHT; h++) {
      const block = [];
      const x_start = crop.left + Math.floor(perWidth * w);
      const x_end = Math.floor(crop.left + Math.floor(perWidth * (w + 1)));
      for (let i = x_start; i <= x_end; i++) {
        const y_start = crop.top + Math.floor(perHeight * h);
        const y_end = Math.floor(crop.top + Math.floor(perHeight * (h + 1)));
        for (let j = y_start; j <= y_end; j++) {
          block.push(getRGB(nd, i, j));
        }
      }
      rgb.push({
        r: block.reduce((p, c) => p + c.r, 0) / block.length,
        g: block.reduce((p, c) => p + c.g, 0) / block.length,
        b: block.reduce((p, c) => p + c.b, 0) / block.length,
      });
    }
  }
  return rgb;
}

export async function handleProcessList() {
  const ids: string[] = [];
  const loop = async (list: any[]) => {
    for (let i = 0; i < list.length; i++) {
      const v = list[i];
      if (v.type === 'picker' && v.crop) {
        ids.push(v.crop.id);
        const image = SNAPSHOT_SELECTED.find(img => img.id === v.crop.id);
        if (image) {
          const rgb = await cutPicture(v.crop, image.buffer);
          const hsv = rgb2hsv(rgb);
          v.rgb = rgb;
          v.grayscale = grayscale(rgb);
          v.hsv = hsv;
          v.lightness = average(hsv.map(light => light.v));
        }
      }
      await loop(v.children);
    }
  };
  await loop(PROCESS_LIST);
  SNAPSHOT_SELECTED = SNAPSHOT_SELECTED.filter(v => ids.includes(v.id));
}
