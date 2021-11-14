import { NdArray } from 'ndarray';
import { HSV, ImageVector, RGB } from './models';
import getPixels from 'get-pixels';

export async function getImageData(snapshot: Buffer | string, type = 'png') {
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
 * @description 获取图片某一点的RGB通道值
 */
export function getRGB(pixels: NdArray, x: number, y: number): RGB {
  const r = pixels.get(x, y, 0); // red
  const g = pixels.get(x, y, 1); // green
  const b = pixels.get(x, y, 2); // blue
  return { r, g, b };
}

/**
 * @description h:色调,s:饱和度,v:明度
 */
export function rgb2hsv(rgb: RGB[]): HSV[] {
  return rgb.map(({ r, g, b }) => {
    const rabs = r / 255;
    const gabs = g / 255;
    const babs = b / 255;
    const max = Math.max(rabs, gabs, babs);
    const min = Math.min(rabs, gabs, babs);
    const v = max;
    const s = (max - min) / max;
    let h!: number;
    if (rabs === max) {
      h = (gabs - babs) / (max - min) * 60;
    }
    if (gabs === max) {
      h = 120 + (babs - rabs) / (max - min) * 60;
    }
    if (babs === max) {
      h = 240 + (rabs - gabs) / (max - min) * 60;
    }
    if (h < 0) {
      h = h + 360;
    }
    return { h, s, v };
  });
}

/**
 * @description 灰度化处理图片
 */
export function grayscale(vector: ImageVector): number[] {
  return vector.map(v => 0.3 * v.r + 0.59 * v.g * 0.11 * v.b);
}
