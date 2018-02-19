const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Promise error worker
workers.create('promise', (worker, elem) => {
    worker.error('There are an error');
}).set('Test promise').run().catch((error) => {
    console.log('Promise catch', '"', error, '"');
});

// Promise without error worker
workers.create('promise2', (worker, elem) => {
    worker._save('There are no error !').pop();
}).set('Test promise').run().then((data) => {
    console.log('Promise then', '"', data, '"');
});

// All workers has finish
workers.complete((error) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error);

     // Console Time
     console.timeEnd('time');
});