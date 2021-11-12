import {getBee, injectStore, setBee, useBee} from '../../store/core';
import { centralEventBus } from '../../helpers/eventbus';
import { List } from 'immutable';

const MAX_HISTORY_SIZE = 6;

interface Snapshot {
  id: string;
  base64: string;
}

const snapshotToken = injectStore<Snapshot | null>('snapshot', null);
const snapshotsToken = injectStore<List<Snapshot>>('snapshots', List([]));

centralEventBus.on('screenshot').subscribe(res => {
  setBee(snapshotToken, res.message);
  let snapshots = getBee(snapshotsToken);
  if (snapshots.size >= MAX_HISTORY_SIZE) {
    snapshots = snapshots.shift();
  }
  snapshots = snapshots.push(res.message);
  setBee(snapshotsToken, snapshots);
});

export const useSnapshot = () => {
  const [snapshot] = useBee(snapshotToken);
  return snapshot;
};

