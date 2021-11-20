import { injectStore, useBee } from '../../store/core';

const processConfig = injectStore('process-state', false);

export const useProcessState = () => {
  return useBee(processConfig);
};

const processLoading = injectStore('process-loading', false);

export const useProcessLoading = () => {
  return useBee(processLoading);
};
