const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Run worker in a timeout
workers.create('timeout', (worker) => {
    console.log('Timeout called');
    worker.pop();
}).timeout(1000);

// All workers has finish
workers.complete((error, fatalError) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error, fatalError);

     // Console Time
     console.timeEnd('time');
});