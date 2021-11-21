import { absoluteCompare, cutPicture, grayscale, lightness, rgb2hsv, textureCompare } from './math';
import { Bitmap, CropData, PickerCondition, ProcessItem } from '../models';

export function randomStr(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function sleep(delay: number, cancel?: (timer: (() => void) | null) => void) {
  if (delay === 0) {
    return;
  }
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      resolve();
      if (typeof cancel === 'function') {
        cancel(null);
      }
    }, delay);
    if (typeof cancel === 'function') {
      cancel(() => {
        clearTimeout(timer);
        reject('sleep stop');
      });
    }
  });
}

export function nextTick() {
  return new Promise<void>((resolve) => {
    setImmediate(resolve);
  });
}

export function setIn(target: any, keyPath: Array<string | number>, value: any) {
  if (target) {
    const key = keyPath.splice(0, 1)[0];
    if (typeof key !== 'undefined') {
      if (keyPath.length && target[key]) {
        setIn(target[key], keyPath, value);
      } else {
        target[key] = value;
      }
    }
  }
}

export class Token<T> {
  promise: Promise<T>;
  resolve!: (value: T | PromiseLike<T>) => void;
  reject!: (reason?: any) => void;
  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}

export const getImageResult = (conditions: PickerCondition[], crop: CropData, bitmap: Bitmap) => {
  return conditions.map(condition => {
    const currentRGB = cutPicture(crop, bitmap);
    let passed = false;
    let value;
    if (condition.type === 'texture') {
      const currentGrayscale = grayscale(currentRGB);
      const similarity = value = textureCompare(crop.grayscale!, currentGrayscale);
      passed = condition.size === 'more' ?
        similarity > condition.value :
        similarity < condition.value;
    } else if (condition.type === 'lightness') {
      const light = value = lightness(currentRGB);
      passed = condition.size === 'more' ?
        light > condition.value :
        light < condition.value;
    } else if (condition.type === 'absolute') {
      const hsv = rgb2hsv(currentRGB);
      const absolute = value = absoluteCompare(crop.hsv!, hsv);
      passed = condition.size === 'more' ?
        absolute > condition.value :
        absolute < condition.value;
    }
    return { passed, value };
  });
};

export function elseIfPassed(current: ProcessItem, last?: ProcessItem) {
  if (
    last?.type === 'picker' && last.otherwise
  ) {
    if (last.skip || last.passed) {
      if (current.type === 'picker' && current.otherwise) {
        current.skip = true;
      }
      return false;
    } else if (current.type === 'picker' && current.otherwise) {
      current.skip = false;
    }
  }
  return true;
}
