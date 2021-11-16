import { injectStore, useBee } from '../../store/core';
import { List } from 'immutable';

const processListToken = injectStore('processList', List<any>([]));

export const useProcessList = () => {
  return useBee(processListToken);
};

export const filterProcess = (processList: any[]): any[] => {
  return processList.map((v: any) => {
    let crop = v.crop;
    if (crop) {
      const { id, left, top, width, height } = crop;
      crop = { id, left, top, width, height };
    }
    return {
      type: v.type,
      key: v.key,
      keydown: v.keydown,
      keyup: v.keyup,
      value: v.value,
      crop,
      children: filterProcess(v.children),
    };
  });
};
