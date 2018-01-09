const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// push worker
workers.create('pushWorker', (worker, elem) => {
  console.log('My elem', elem);
  worker.pop();
}, null).run();
workers.pushWorker.complete(() => {
    console.log('All "pushWorker" has finished');
}, false); // false = don't destroy callback

// Run worker in a setInterval
workers.create('interval', (worker) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    workers.pushWorker.push(possible.charAt(Math.floor(Math.random() * possible.length))); // we adding an element to pushWorker

    worker.save(worker.get() + 1);
    worker.pop();

    if (worker.get() == 5) {
        workers.interval.stop();
    }
}).save(0).interval(~~(Math.random() * 1000));

// All workers has finish
workers.complete((error, fatalError) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error, fatalError);

     // Console Time
     console.timeEnd('time');
});