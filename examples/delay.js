const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Run worker in a timeout
workers.create('Delay', (worker) => {
    console.log('Delay called');
    worker.pop();
}).delay(1000);

// All workers has finish
workers.complete((error) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error);

     // Console Time
     console.timeEnd('time');
});