import { ImagePoint, ImageVector, RGB, SnapshotItem } from './models';
import getPixels from 'get-pixels';
import screenShotDesktop from 'screenshot-desktop';
import { NdArray } from 'ndarray';
import { randomStr } from './utils';
import { centralEventBus } from './event-bus';

const MAX_HISTORY_SIZE = 6;
const SNAPSHOT_HISTORY: SnapshotItem[] = [];
const SNAPSHOT_SELECTED: SnapshotItem[] = [];

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
export const addSelected = (value: string) => {
  const history = SNAPSHOT_HISTORY.find(v => v.id === value);
  if (history) {
    SNAPSHOT_SELECTED.push(history);
  }
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

export async function getImageData(snapshot: Buffer, type = 'png') {
  return await getPxData(
    snapshot,
    `image/${type}`
  );
}

/**
 * @description 返回图像的像素信息
 */
export function getPxData(image: string | Buffer, type = 'png') {
  return new Promise<NdArray>((resolve, reject) => {
    getPixels(image, type, (err, pixels) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(pixels);
    });
  });
}

/**
 * @description 切割图片
 */
export function cutPicture() {}

/**
 * @description 获取图片某一点的RGB通道值
 */
export function getRGB(pixels: any, x: number, y: number): RGB {
  const r = pixels.get(x, y, 0); // red
  const g = pixels.get(x, y, 1); // green
  const b = pixels.get(x, y, 2); // blue
  return { r, g, b };
}

/**
 * @description 压缩图片至固定大小
 */
export function serialize(arr: ImagePoint[], x = 8, y = 8) {

}

/**
 * @description 灰度化处理图片
 */
export function grayscale(vector: ImageVector): number[] {
  return vector.map(v => 0.3 * v.r + 0.59 * v.g * 0.11 * v.b);
}
