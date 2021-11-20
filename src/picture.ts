import robot from 'robotjs';
import { Bitmap } from './models';
import { PNG } from 'pngjs';

function scan(bitmap: Bitmap, x: number, y: number, w: number, h: number, f: (x: number, y: number, idx: number) => void) {
  x = Math.round(x);
  y = Math.round(y);
  w = Math.round(w);
  h = Math.round(h);
  for (let _y = y; _y < y + h; _y++) {
    for (let _x = x; _x < x + w; _x++) {
      const idx = (bitmap.width * _y + _x) << 2;
      f(_x, _y, idx);
    }
  }
}

export function screenshot(x?: number, y?: number, width?: number, height?: number): Bitmap {
  const bitmap = robot.screen.capture(x, y, width, height);
  const image = Buffer.alloc(bitmap.width * bitmap.height * 4);
  let pos = 0;
  scan(bitmap, 0, 0, bitmap.width, bitmap.height, (x, y, idx) => {
    image[idx + 2] = bitmap.image.readUInt8(pos++); // blue
    image[idx + 1] = bitmap.image.readUInt8(pos++); // green
    image[idx] = bitmap.image.readUInt8(pos++); // red
    image[idx + 3] = bitmap.image.readUInt8(pos++); // alpha
  });
  return {
    width: bitmap.width,
    height: bitmap.height,
    image,
  };
}

export function getBuffer(bitmap: Bitmap) {
  const png = new PNG({
    width: bitmap.width,
    height: bitmap.height
  });

  png.data = bitmap.image;

  return PNG.sync.write(png);
}
