const { timer, repeat, of, Observable, from } = require('rxjs');
const { mergeMap } = require('rxjs/operators');

const observable = new Observable(subscriber => {
  setImmediate(() => {
    subscriber.next();
    subscriber.complete();
  });
});

function nextTick() {
  return new Promise((resolve) => {
    setTimeout(resolve, 1000);
  });
}
from(nextTick()).pipe(
  repeat(),
).subscribe(() => {
  console.log(123);
});
/*const loop = () => {
  return nextTick().then(() => {
    console.log(123);
    loop();
  });
};
loop();*/
setInterval(() => {
  console.log(465);
}, 20);

