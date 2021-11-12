import { ipcMain, WebContents } from 'electron';
import { Observable } from 'rxjs';

class EventBus {
  webContents?: WebContents;
  on(channel: string) {
    return new Observable<{ event: any; message: any; }>(subscriber => {
      const listener = (event: any, message: any) => {
        subscriber.next({ event, message });
      };
      ipcMain.on(channel, listener);
      return {
        unsubscribe() {
          ipcMain.removeListener(channel, listener);
        },
      };
    });
  }
  emit(channel: string, data: any) {
    this.webContents?.send(channel, data);
  }
  clearAll(channel: string) {
    ipcMain.removeAllListeners(channel);
  }
}

export const centralEventBus = new EventBus();
