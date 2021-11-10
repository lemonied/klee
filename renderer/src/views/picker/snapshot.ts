import { injectStore, setBee, useBee } from '../../store/core';
import { centralEventBus } from '../../helpers/eventbus';

const token = injectStore('snapshot', '');

centralEventBus.on('screenshot').subscribe(res => {
  setBee(token, res.message);
});

export const useSnapshot = () => {
  const [snapshot] = useBee(token);
  return snapshot;
};
