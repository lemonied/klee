import {
  workerData,
  parentPort,
} from 'worker_threads';
import { Bitmap, ProcessItem } from './models';
import { elseIfPassed, getImageResult } from './utils/utils';
import {
  finalize,
  mapTo,
  mergeMap,
  mergeMapTo,
  MonoTypeOperatorFunction,
  Observable,
  of,
  Subscription,
  tap,
  timer
} from 'rxjs';

const shared = workerData as ProcessItem[];

let subscription: Subscription | undefined;
const onMessage = async (data: { bitmap: Bitmap; type: string; }) => {
  const { bitmap, type } = data;
  const $: MonoTypeOperatorFunction<{ list: ProcessItem[]; item: ProcessItem; index: number; }> = (source) => {
    return source.pipe(
      mergeMap(result => {
        const { item, list, index } = result;
        const last = list[index - 1];
        const next = list[index + 1];
        if (index < list.length - 1 && !elseIfPassed(item, last)) {
          return of({ item: next, list, index: index + 1 }).pipe($);
        }
        let next$: Observable<any> = of(null);
        if (item.type === 'general' && item.key) {
          next$ = timer(item.keydown);
          if (item.keyup > 0) {
            next$ = next$.pipe(
              mergeMap(() => {
                parentPort?.postMessage({
                  type: 'keyToggle',
                  key: item.key,
                  behavior: 'down',
                });
                return timer(item.keyup);
              }),
              tap(() => {
                parentPort?.postMessage({
                  type: 'keyToggle',
                  key: item.key,
                  behavior: 'up',
                });
              }),
            );
          } else {
            parentPort?.postMessage({
              type: 'keyTap',
              key: item.key,
            });
          }
        } else if (item.type === 'picker') {
          if (item.children.length) {
            const imageResult = getImageResult(item.conditions, item.crop!, bitmap, item.area);
            item.passed = imageResult.every(v => v.passed);
            parentPort?.postMessage({ type: 'log', data: imageResult });
            if (item.passed) {
              next$ = next$.pipe(mapTo({ list: item.children, item: item.children[0], index: 0 }), $);
            }
          }
        } else if (item.type === 'timeout') {
          next$ = next$.pipe(mergeMapTo(timer(item.value)));
        }
        if (index < list.length - 1) {
          return next$.pipe(mergeMapTo(of({ item: next, list, index: index + 1 })), $);
        }
        return next$;
      }),
    );
  }
  if (type === 'screenshot' && shared.length) {
    subscription?.unsubscribe();
    subscription = of({ list: shared, index: 0, item: shared[0] }).pipe(
      $,
      finalize(() => {
        parentPort?.postMessage({ type: 'finish' });
      }),
    ).subscribe();
  } else if (type === 'shutdown') {
    subscription?.unsubscribe();
    subscription = undefined;
  }
};

parentPort?.on('message', onMessage);
