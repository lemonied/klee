import robot from 'robotjs';
import Jimp from 'jimp';

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
