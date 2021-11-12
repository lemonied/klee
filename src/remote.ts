import { addSelected, screenshot } from './processor';
import { globalShortcut, app, BrowserWindow } from 'electron';
import { centralEventBus } from './event-bus';
import { tap } from 'rxjs';

async function onScreenshot() {
  const snapshot = await screenshot();
  centralEventBus.emit('screenshot', {
    id: snapshot.id,
    base64: snapshot.buffer.toString('base64'),
  });
}

function screenshotListener() {
  centralEventBus.on('select').subscribe((e) => {
    addSelected(e.message);
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
  screenshotListener();
  onWindowOperator(win);
  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
