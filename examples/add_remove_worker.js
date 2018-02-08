const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Basic worker without array
workers.create('simple', (worker, elem) => {
    setTimeout(() => {
        console.log('simple =>', elem);
        worker.pop();
    }, (~~(Math.random() * 1000)));
}, "toto").run();
workers.simple.complete(() => {
    console.log('All "simple" has finished');
});
 
// Simulate adding a worker
workers.simple.addWorker();
setTimeout(() => {
    console.log('Okay now "simple" is complete');
    workers.simple.removeWorker();
}, 2000);

// All workers has finish
workers.complete((error) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error);

     // Console Time
     console.timeEnd('time');
});