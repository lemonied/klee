import { injectStore, useBee } from '../../store/core';

const baseConfig = injectStore('base-config', {
  type: 'press',
  button: 5,
  workerDelay: 500,
});

export const useBaseConfig = () => {
  return useBee(baseConfig);
};
