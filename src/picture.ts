import { CropData, HSV, RGB } from './models';
import robot from 'robotjs';
import Jimp from 'jimp';
import { Bitmap } from '@jimp/core';

/**
 * @description 获取图片某一点的RGB通道值
 */
export function getRGB(bitmap: Bitmap, x: number, y: number): RGB {
  const base = x * 4 + y * bitmap.width * 4;
  const r = bitmap.data[base]; // red
  const g = bitmap.data[base + 1]; // green
  const b = bitmap.data[base + 2]; // blue
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
export function grayscale(vector: RGB[]): number[] {
  return vector.map(v => 0.3 * v.r + 0.59 * v.g * 0.11 * v.b);
}

/**
 * @description 切割图片，宽高等分
 */
const CUT_WIDTH = 8;
const CUT_HEIGHT = 8;
export function cutPicture(crop: CropData, bitmap: Bitmap, type = 'png') {
  const rgb: RGB[] = [];
  const perWidth = crop.width / CUT_WIDTH;
  const perHeight = crop.height / CUT_HEIGHT;
  for (let w = 0; w < CUT_WIDTH; w++) {
    for (let h = 0; h < CUT_HEIGHT; h++) {
      const block = [];
      const x_start = crop.left + Math.floor(perWidth * w);
      const x_end = Math.floor(crop.left + Math.floor(perWidth * (w + 1)));
      const y_start = crop.top + Math.floor(perHeight * h);
      const y_end = Math.floor(crop.top + Math.floor(perHeight * (h + 1)));
      for (let i = x_start; i <= x_end; i++) {

        for (let j = y_start; j <= y_end; j++) {
          block.push(getRGB(bitmap, i, j));
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

export function jimpScreenShot(x?: number, y?: number, width?: number, height?: number) {
  const bitmap = robot.screen.capture(x, y, width, height);
  const image = new Jimp(bitmap.width, bitmap.height);
  let pos = 0;
  image.scan(0, 0, bitmap.width, bitmap.height, (x, y, idx) => {
    image.bitmap.data[idx + 2] = bitmap.image.readUInt8(pos++); // blue
    image.bitmap.data[idx + 1] = bitmap.image.readUInt8(pos++); // green
    image.bitmap.data[idx] = bitmap.image.readUInt8(pos++); // red
    image.bitmap.data[idx + 3] = bitmap.image.readUInt8(pos++); // alpha
  });
  return image;
}
