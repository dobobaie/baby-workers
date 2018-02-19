const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Simulate adding a worker
workers.addWorker();

// Basic worker without array
workers.create('simple', (worker, elem) => {
    setTimeout(() => {
        console.log('simple =>', elem);
        worker.pop();
    }, (~~(Math.random() * 1000)));
}).set('toto').run();

workers.simple.complete(() => {
    console.log('All "simple" has finished');
});
 
// Simulate adding a worker
workers.simple.addWorker();
setTimeout(() => {
    console.log('Okay now "simple" is complete');
    setTimeout(() => {
        workers.simple.removeWorker();
    }, 1000);
    workers.removeWorker();
}, 2000);

// All workers has finish
workers.complete((error) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error);

     // Console Time
     console.timeEnd('time');
});