const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Set errors
workers.create('errorComplete', (worker) => {
    worker.error('Why ?', 'Because you stole my bread dude...')
    worker.pop();
}).run()

// All workers has finish
workers.complete((error, fatalError) => {
    console.log('All "workers" has finished', 'maybe some errors ?', error, fatalError);

    // Console Time
    console.timeEnd('time');
});