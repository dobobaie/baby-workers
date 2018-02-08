const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Promises error worker
workers.create('promises', (worker, elem) => {
    worker.error('There are an error').pop(); // pop is important !
}, 'Test promises').run().catch((error) => {
    console.log('Promises catch', '"', error, '"');
});

// Promises without error worker
workers.create('promises2', (worker, elem) => {
    worker._save('There are no error !').pop(); // pop is important !
}, 'Test promises').run().then((data) => {
    console.log('Promises then', '"', data, '"');
});

// All workers has finish
workers.complete((error) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error);

     // Console Time
     console.timeEnd('time');
});