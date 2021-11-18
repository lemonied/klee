import { injectStore, useBee } from '../../store/core';
import { List } from 'immutable';

const processListToken = injectStore('processList', List<any>([]));

export const useProcessList = () => {
  return useBee(processListToken);
};

export const filterProcess = (processList: any[]): any[] => {
  return processList.map((v: any) => {
    const crop = v.crop;
    return {
      type: v.type,
      key: v.key,
      keydown: v.keydown,
      keyup: v.keyup,
      value: v.value,
      otherwise: v.otherwise,
      conditions: v.conditions,
      crop,
      children: v.children && filterProcess(v.children),
    };
  });
};
