import { screenshot } from './processor';
import { ipcMain, globalShortcut, app, BrowserWindow, WebContents } from 'electron';
import { Observable, tap } from 'rxjs';
import { randomStr } from './utils';

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

const centralEventBus = new EventBus();

async function onScreenshot() {
  const buffer = await screenshot();
  centralEventBus.emit('screenshot', {
    id: randomStr(),
    base64: buffer.toString('base64'),
  });
}

function onWindowOperator(win: BrowserWindow) {
  centralEventBus.on('focus').pipe(
    tap(() => win.focus()),
  ).subscribe();
  centralEventBus.on('hide').pipe(
    tap(() => win.hide()),
  ).subscribe();
  centralEventBus.on('minimize').pipe(
    tap(() => win.minimize()),
  ).subscribe();
  centralEventBus.on('close').pipe(
    tap(() => win.close()),
  ).subscribe();
}

export function startChildProcess(win: BrowserWindow) {
  centralEventBus.webContents = win.webContents;
  globalShortcut.register('CommandOrControl+Alt+num0', onScreenshot);
  globalShortcut.register('CommandOrControl+Alt+0', onScreenshot);
  onWindowOperator(win);
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
