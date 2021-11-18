import {
  getHistory,
  cancelMouseListener,
  screenshot,
  setProcessList,
  startProcessList
} from './processor';
import { globalShortcut, app, BrowserWindow } from 'electron';
import { centralEventBus } from './event-bus';
import { tap } from 'rxjs';
import { CropData } from './models';
import { cutPicture, grayscale, rgb2hsv, average } from './utils/math';

async function onScreenshot() {
  const snapshot = await screenshot();
  centralEventBus.emit('screenshot', {
    id: snapshot.id,
    timestamp: snapshot.timestamp,
    base64: snapshot.dataURL,
  });
}

function screenshotListener() {
  centralEventBus.on('select').subscribe((e) => {
    const crop = e.message as CropData;
    const image = getHistory(crop);
    if (image) {
      try {
        const rgb = cutPicture(crop, image.jimp.bitmap);
        const hsv = rgb2hsv(rgb);
        const grayScale = grayscale(rgb)
        const imageData = {
          rgb,
          grayscale: grayScale,
          hsv,
          lightness: parseFloat(average(hsv.map(light => light.v)).toFixed(4)),
        };
        Object.assign(crop, imageData);
        e.event.reply('select-reply', crop);
      } catch (error) {
        e.event.reply('select-reply', 'error');
      }
    } else {
      e.event.reply('select-reply', 'error');
    }
  });
  centralEventBus.on('process-list').subscribe((e) => {
    try {
      setProcessList(e.message);
      e.event.reply('process-list-reply', 'success');
    } catch (error) {
      e.event.reply('process-list-reply', 'error');
    }
  });
  centralEventBus.on('start-process').subscribe((e) => {
    try {
      startProcessList(e.message);
      e.event.reply('start-process-reply', 'success');
    } catch (error) {
      e.event.reply('start-process-reply', 'error');
    }
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
  win.webContents.addListener('before-input-event', async (e, input) => {
    if (input.type === 'keyDown' && input.code === 'F5') {
      win.reload();
      await cancelMouseListener();
    }
    if (input.type === 'keyDown' && input.code === 'F12') {
      win.webContents.openDevTools();
    }
  });
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
