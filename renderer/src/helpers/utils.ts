export function combineClassNames(...args: (string | null | undefined)[]) {
  const classNames: string[] = [];
  args.forEach(item => {
    if (typeof item !== 'string') {
      return;
    }
    item = item.trim();
    if (!item) {
      return;
    }
    item.split(' ').forEach(className => {
      if (classNames.indexOf(className) === -1) {
        classNames.push(className);
      }
    });
  });
  return classNames.join(' ');
}

export function randomStr(prefix: string, length = 5) {
  return `${prefix}_${Math.random().toString(36).slice(2, 2 + length)}`;
}

export function average(list: number[]) {
  return list.reduce((p, c) => p + c, 0) / list.length;
}
