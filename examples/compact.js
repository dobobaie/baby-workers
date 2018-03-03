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
}).map(['a', 'b', 'c', 'd']).run().then((data) => {
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
}).map(['e', 'f', 'g', 'h']).run();

workers.basic.complete(() => {
    console.log('All "basic" has finished');
}).then((data) => {
    console.log('Basic Then', data);
}).catch((data) => {
    console.log('Basic Catch', data);
});

// Promises error worker
workers.create('promises', (worker, elem) => {
    worker.error('There are an error');
}).set('Test promises').run().catch((error) => {
    console.log('Promises catch', '"', error, '"');
});

// Promises without error worker
workers.create('promises2', (worker, elem) => {
    worker._save('There are no error !').pop();
}).set('Test promises').run().then((data) => {
    console.log('Promises then', '"', data, '"');
});

// Stack worker 
workers.create('stack', (worker, elem) => {
    setTimeout(() => {
        console.log('stack =>', elem, ' - ', 'my id =>', worker.getId());
        worker.pop();
    }, (~~(Math.random() * 1000)));
}).map(['z', 'y', 'x', 'w']).stack(); // mode stack enabled
workers.stack.complete(() => {
    console.log('All "stack" has finished');
});

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
    workers.simple.removeWorker();
}, 2000);

// Run worker in a timeout
workers.create('Delay', (worker) => {
    console.log('Timeout called');
    worker.pop();
}).delay(1000);

// push worker
workers.create('pushWorker', (worker, elem) => {
    console.log('My elem', elem);
    worker.pop();
}).run();
workers.pushWorker.complete(() => {
    console.log('All "pushWorker" has finished');
}, false); // false = don't destroy callback

// Run worker in a setInterval
workers.create('interval', (worker) => {
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    workers.pushWorker.push(possible.charAt(Math.floor(Math.random() * possible.length))); // we adding an element to pushWorker

    worker._save(worker._get() + 1);
    worker.pop();

    if (worker._get() == 5) {
        workers.interval.stop();
    }
}).save(0).interval(~~(Math.random() * 1000));

// Manipule worker data
workers.create('data', (worker) => {
    // var tab = worker.root().get();
    var tab = worker._get(); // new version to get data from root
    tab.push('coucou');
    // worker.root().save(tab);
    worker._save(tab); // new version to save data from root
    worker.save('coucou is my name');
    
    worker.create('data2', (worker) => {
        var tab = worker.parent('data').get();
        tab.push(worker.parentNode('data').get());
        worker.parent('data').save(tab);
        worker.pop();
    }).run();

    worker.complete(() => {
        // console.log('Tab ?', worker.root().get());
        console.log('Tab ?', worker._get()); // new version to get data from root
    });
    worker.pop();
}).save([]).run();

workers.create('data2', (worker) => {
    console.log(worker._get());
    worker.pop();
}).save('elements.0.element.1.toto', []).run();

// Cancel parent worker
// const runMe = workers.create('cancel', (worker) => {
//     console.log('Here is never called');
//     worker.pop();
// });
// runMe.cancel();

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
        })
        .map(random2)
        .limit(0) // Unlimit worker but if parent have a limit so it take parent limit
        .limit(-1) // Unlimit worker
        .run();

        worker.randomLimit.complete(() => {
            worker.pop();
        });

    }, (~~(Math.random() * 1000)));
}).map(random).limit(2).run();

// Set errors
workers.create('errorComplete', (worker) => {
    worker.error('Why ?', 'Because you stole my bread dude...');
}).run()

// All workers has finish
workers.then(() => {
    console.log('All "workers" has finished', 'Then is called');
}).catch(() => {
    console.log('All "workers" has finished', 'Catch is called');
}).complete((error) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error);

     // Console Time
     console.timeEnd('time');
});