const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

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

// All workers has finish
workers.complete((error) => {
    console.log('All "workers" has finished', 'maybe some errors ?', error);

    // Console Time
    console.timeEnd('time');
});