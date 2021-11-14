export function randomStr(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length);
}

export function average(list: number[]) {
  return list.reduce((p, c) => p + c, 0) / list.length;
}
