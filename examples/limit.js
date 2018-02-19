const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Limit workers
const random = ['<r>', '<a>', '<n>', '<d>', '<o>', '<m>'];
var a = workers.create('limitWorker', (worker, randomValue) => {
    console.log('limitWorker', randomValue,
        'LimitWorker Workers:', worker.getWorkers(),
        'LimitWorker Waiting workers', worker.getWaitingWorkers(),
        'LimitWorker Running workers', worker.getRunningWorkers(),
        'Total workers:', workers.getTotalWorkers(),
        'Total waiting workers', workers.getTotalWaitingWorkers(),
        'Total running workers', workers.getTotalRunningWorkers()
    );
    setTimeout(() => {
        
        const random2 = [randomValue + '<r>', randomValue + '<a>', randomValue + '<n>', randomValue + '<d>', randomValue + '<o>', randomValue + '<m>'];
        worker.create('randomLimit', (worker, randomValue) => {
            setTimeout(() => {
               console.log('randomLimit', randomValue,
                    'Total workers:', workers.getTotalWorkers(),
                    'Total waiting workers', workers.getTotalWaitingWorkers(),
                    'Total running workers', workers.getTotalRunningWorkers()
                );          
               worker.pop();
            }, (~~(Math.random() * 1000)));
        }).map(random2)
        .limit(0) // Unlimit worker but if parent have a limit so it take parent limit
        .limit(-1) // Unlimit worker
        .run();

        worker.randomLimit.complete(() => {
            worker.pop();
        });

    }, (~~(Math.random() * 1000)));
}).map(random).limit(2).run();

// const random = ['<r>', '<a>', '<n>', '<d>', '<o>', '<m>', '<r>', '<a>', '<n>', '<d>', '<o>', '<m>'];
// workers.create('limitWorker', (worker, randomValue) => {
//     console.log(
//         'Id:', worker.getId(),
//         'limitWorker', randomValue,
//         'LimitWorker Workers:', worker.getWorkers(),
//         'LimitWorker Waiting workers', worker.getWaitingWorkers(),
//         'LimitWorker Running workers', worker.getRunningWorkers(),
//         'Total workers:', workers.getTotalWorkers(),
//         'Total waiting workers', workers.getTotalWaitingWorkers(),
//         'Total running workers', workers.getTotalRunningWorkers()
//     );
//     setTimeout(() => {
//         worker.pop()
//     }, (~~(Math.random() * 5000)));
// }).map(random).limit(2).run();


// All workers has finish
workers.complete((error) => {
    console.log('All "workers" has finished', 'maybe some errors ?', error);

    // Console Time
    console.timeEnd('time');
});