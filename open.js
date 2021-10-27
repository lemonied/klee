const child_progress = require('child_process');

process.env.NODE_ENV = 'development';
const progress = child_progress.exec('electron .');
progress.stdout.pipe(process.stdout);
progress.stderr.pipe(process.stderr);
