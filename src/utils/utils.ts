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

export function log(...args: any[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args);
  }
}
