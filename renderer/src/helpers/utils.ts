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

export function randomStr(prefix: string | number, length = 5) {
  return `${prefix}_${Math.random().toString(36).slice(2, 2 + length)}`;
}

export function downloadJson(data: any, filename: string) {
  const a = document.createElement('a');
  const content = JSON.stringify(data);
  a.download = filename;
  const blob = new Blob([content]);
  a.href = URL.createObjectURL(blob);
  a.click();
}

