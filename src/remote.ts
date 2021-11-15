import {
  addSelected,
  cancelMouseListener,
  cutPicture,
  screenshot,
  setProcessList,
  startProcessList
} from './processor';
import { grayscale, rgb2hsv } from './picture';
import { globalShortcut, app, BrowserWindow } from 'electron';
import { centralEventBus } from './event-bus';
import { tap } from 'rxjs';
import { CropData } from './models';

async function onScreenshot() {
  const snapshot = await screenshot();
  centralEventBus.emit('screenshot', {
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    base64: snapshot.buffer.toString('base64'),
  });
}

function screenshotListener() {
  centralEventBus.on('select').subscribe(async (e) => {
    const crop = e.message as CropData;
    const image = addSelected(crop);
    if (image) {
      try {
        const rgb = await cutPicture(crop, image.buffer);
        crop.rgb = rgb;
        crop.grayscale = grayscale(rgb);
        crop.hsv = rgb2hsv(rgb);
        e.event.reply('select-reply', crop);
      } catch (error) {
        e.event.reply('select-reply', 'error');
      }
    } else {
      e.event.reply('select-reply', 'error');
    }
  });
  centralEventBus.on('process-list').subscribe(async (e) => {
    await setProcessList(e.message);
    e.event.reply('process-list-reply', 'success');
  });
  centralEventBus.on('start-process').subscribe(async (e) => {
    await startProcessList(e.message);
    e.event.reply('start-process-reply', 'success');
  });
  centralEventBus.on('stop-process').subscribe((e) => {
    cancelMouseListener();
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
