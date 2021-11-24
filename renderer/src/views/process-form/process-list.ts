import { injectStore, useBee } from '../../store/core';
import { List } from 'immutable';
import { ProcessItem } from '../../models';

const processListToken = injectStore('processList', List<ProcessItem>([]));

export const useProcessList = () => {
  return useBee(processListToken);
};

const secondaryProcessListToken = injectStore('secondaryProcessList', List<ProcessItem>([]));

export const useSecondaryProcessList = () => {
  return useBee(secondaryProcessListToken);
};

export const filterProcess = (processList: any[]): any[] => {
  return processList.filter(v => v.available).map(v => {
    const crop = v.crop;
    return {
      type: v.type,
      key: v.key,
      keydown: v.keydown,
      keyup: v.keyup,
      value: v.value,
      otherwise: v.otherwise,
      conditions: v.conditions,
      area: v.area,
      crop,
      children: v.children && filterProcess(v.children),
    };
  });
};
