const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Cancel parent worker
const runMe = workers.create('cancel', (worker) => {
    console.log('Here is never called');
    worker.pop();
});

// process

runMe.cancel();

// All workers has finish
workers.complete((error) => {
    console.log('Worker was canceled so workers.complete is never called');
});