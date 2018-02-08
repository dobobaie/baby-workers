const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Basic worker
workers.create((worker, elem) => {
    setTimeout(() => {
        console.log('unknown =>', elem, ' - ', 'my id =>', worker.getId());
        worker.pop();
    }, (~~(Math.random() * 1000)));
}, ['a', 'b', 'c', 'd']).run().then((data) => {
    console.log('Unknown Promises then', data);
}).catch((data) => {
    console.log('Unknown Promises catch', data);
});

// Basic worker with a name
workers.create('basic', (worker, elem) => {
    setTimeout(() => {
        console.log('basic =>', elem, ' - ', 'my id =>', worker.getId());
        worker.pop();
    }, (~~(Math.random() * 1000)));
}, ['e', 'f', 'g', 'h']).run();

workers.basic.complete(() => {
    console.log('All "basic" has finished');
}).then((data) => {
	console.log('Basic Then', data);
}).catch((data) => {
	console.log('Basic Catch', data);
});

// All workers has finish
workers.complete((error) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error);

     // Console Time
     console.timeEnd('time');
});