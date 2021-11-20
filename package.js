const child_progress = require('child_process');

const platform = (process.argv.find(v => v.indexOf('--') === 0) || '').replace(/^--/, '');

const progress = child_progress.exec(`electron-packager ./ Windy --platform=${platform} --ignore=".git|.idea|src|renderer" --overwrite --icon=./renderer/public/favicon.ico`);
progress.stdout.pipe(process.stdout);
progress.stderr.pipe(process.stderr);
