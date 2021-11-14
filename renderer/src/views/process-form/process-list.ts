import { injectStore, useBee } from '../../store/core';
import { List } from 'immutable';

const processListToken = injectStore('processList', List<any>([]));

export const useProcessList = () => {
  return useBee(processListToken);
};

export const filterProcess = (processList: List<any>) => {
  const list = processList.toJS();
  const loop = (l: any[]) => {
    l.forEach(v => {
      const crop = v.crop;
      if (crop) {
        const { id, left, top, width, height } = crop;
        v.crop = { id, left, top, width, height };
      }
      loop(v.children);
    });
  };
  loop(list);
  return list;
};
