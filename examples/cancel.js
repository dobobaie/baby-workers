const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Cancel parent worker
const runMe = workers.create('cancel', (worker) => {
    console.log('Here is never called');
    worker.pop();
});
runMe.cancel();

// All workers has finish
workers.complete((error, fatalError) => {
    console.log('All "workers" has finished', 'maybe some errors ?', error, fatalError);

    // Console Time
    console.timeEnd('time');
});