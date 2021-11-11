export function randomStr(length = 6) {
  return Math.random().toString(36).slice(2, 2 + length);
}
