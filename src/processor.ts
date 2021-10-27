import { ImagePoint, ImageVector, RGB } from './models';
import getPixels from 'get-pixels';
import screenShotDesktop from 'screenshot-desktop';
import { NdArray } from 'ndarray';

/**
 * @description 全屏截图并返回图像信息
 * screen表示第n个屏幕，默认截取第一个
 */
export async function screenshot(screen?: number) {
  return await screenShotDesktop({ format: 'png', screen });
}

export async function getScreenshotData() {
  return await getPxData(
    await screenshot(),
    'image/png'
  );
}

/**
 * @description 返回图像的像素信息
 */
export function getPxData(image: string | Buffer, type: string) {
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
