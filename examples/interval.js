const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Run worker in a setInterval
workers.create('interval', (worker) => {
    console.log('Interval called');
    worker.save(worker.get() + 1);
    worker.pop();

    if (worker.get() == 5) {
        workers.interval.stop();
    }
}).save(0).interval(1000);

// All workers has finish
workers.complete((error, fatalError) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error, fatalError);

     // Console Time
     console.timeEnd('time');
});