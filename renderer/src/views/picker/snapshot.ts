import {getBee, injectStore, setBee, useBee} from '../../store/core';
import { centralEventbus } from '../../helpers/eventbus';
import { List } from 'immutable';

const MAX_HISTORY_SIZE = 6;

export interface Snapshot {
  id: string;
  timestamp: number;
  base64: string;
}

const snapshotToken = injectStore<Snapshot | null>('snapshot', null);
const snapshotsToken = injectStore<List<Snapshot>>('snapshots', List([]));

export const setSnapshotsHistory = (snapshot: Snapshot) => {
  let snapshots = getBee(snapshotsToken);
  if (snapshots.size >= MAX_HISTORY_SIZE) {
    snapshots = snapshots.shift();
  }
  snapshots = snapshots.push(snapshot);
  setBee(snapshotsToken, snapshots);
};

centralEventbus.on('screenshot').subscribe(res => {
  setBee(snapshotToken, res.message);
  setSnapshotsHistory(res.message);
});

export const useSnapshot = () => {
  return useBee(snapshotToken);
};

export const useSnapshotsHistory = () => {
  return useBee(snapshotsToken);
};
