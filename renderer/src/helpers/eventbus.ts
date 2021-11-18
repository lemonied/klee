import { filter, Observable, take } from 'rxjs';

const globalEvents = (window as any).globalEvents;

export const centralEventbus = {
  on: (channel: string) => {
    return new Observable<{ event: any; message: any; }>(subscriber => {
      const listener = (event: any, message: any) => {
        subscriber.next({ event, message });
      };
      globalEvents?.on(channel, listener);
      return {
        unsubscribe() {
          globalEvents?.removeListener(channel, listener);
        },
      };
    });
  },
  emit: (channel: string, data?: any) => {
    globalEvents?.send(channel, data);
    return centralEventbus.on(`${channel}-reply`).pipe(
      take(1),
      filter(res => res.message !== 'error'),
    );
  },
  clearAll: (channel?: string) => {
    globalEvents?.removeAllListeners(channel);
  },
};
