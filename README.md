# Workers Javascript
Manage your functions asynchronously or as stack/timeout/interval/queue with baby-workers and promises.

## Install

``` bash
npm install --save baby-workers

``` 

## Last release

Version | Change log | Compatibility
---- | --------- | -----------
2.0.0 | Add promises after run/timeout/interval/stack function + add then/catch callback + catch error in run/timeout/interval/stack callback + add feature to create worker without name | >= 2.0.0
1.0.71 | Add getNodes function | <= 1.0.71

## Usage
Create as much workers that you need, for a simple function or for each element of an array, they will be executed in specific callback !
Plus, It's like Thread in another language you can control all workers and limit the number of execute of asynchronous functions.

``` js
const babyWorkers = require('baby-workers');

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
```

More examples at the end of README.md file.

## Demos
* [Basic](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/basic.js)
* [Promises](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/promises.js)
* [Stack](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/stack.js)
* [Simulate adding/removing worker](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/add_remove_worker.js)
* [Set timeout](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/timeout.js)
* [Set interval](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/interval.js)
* [Push](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/push.js)
* [Adding data](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/data.js)
* [Cancel worker](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/cancel.js)
* [Limit workers with a queue](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/limit.js)
* [Set error](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/error.js)
* [All](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/all.js)

## How is it works ?

Three entites :
* Root (default instance never use by you)
* Parent (parent instance created by worker.create)
* Node (node instance created by parent for each element of array).

The principe is to run asynchronouse (or not) function easily and manage them when the worker has finished with a callback.
Launch any request on any element.

## Functions

Name | Available | Description | Additionnal
---- | --------- | ----------- | -----------
create(name: `string`, callback: `function`, data: `any = undefined`) : `currentWorker` | ALL | Create a new worker (if data is `null` so no node will be create)
run() : `Promises` | PARENT | Run current worker
stack() : `Promises` | PARENT | Run nodes like stack 
timeout(time: `number = 1`) : `Promises` | PARENT | Run nodes like run in setTimeout 
interval(time: `number = 1000`) : `Promises` | PARENT | Run nodes like run in setInterval | stop() : `currentWorker`, NODE, Stop interval 
push(data: `any`) : `currentWorker` | PARENT | Push a new node to worker it will be executed if worker is running (if data is `null` so no node will be create)
cancel() : `currentWorker` | PARENT | Cancel current instance and execute complete callback 
limit(maxWorkers: `number = 0`, extra: `boolean = false`) | ALL | Limit the number of workers as running (`maxWorkers = 0` = unlimited or take limit of parent | `maxWorkers = -1` = unlimited and ignore parent). If `extra = true` is true so maxWorkers is taken ONLY if parent workers limit is full
pop() : `currentWorker` | NODE | Stop current node
addWorker() : `currentWorker` | ALL | Add virtual worker in current worker (it used for external asynch function) 
removeWorker() : `currentWorker` | ALL | Remove virtual worker in current worker (it used for external asynch function) 
complete(callback: `function`, removeAfterCall: `boolean`) : `currentWorker` | ALL | Call function when current process is finish (node, parent => when childrens are finish or root => when childrens are finish) 
then(callback: `function`, removeAfterCall: `boolean`) : `currentWorker` | ALL | Call function when current process is finish without error
catch(callback: `function`, removeAfterCall: `boolean`) : `currentWorker` | ALL | Call function when current process is finish with error 
error(error: `string`) : `currentWorker` | ALL | Set error in current worker and all parent in the tree
save(data: `any`) : `currentWorker` | ALL | Save any data in current worker (node, parent or root) 
_save(data: `any`) : `currentWorker` | ALL | Save any data in current worker (node, parent or root) from root
get() : `any` | ALL | Get data previously saved 
_get() : `any` | ALL | Get data previously saved from root 
root() : `parentWorker` | NODE | Get root/parent of current worker 
parent(name: `string`, type: `string = 'parent'`) : `parentWorker OR nodeWorker` | PARENT & NODE | Get any parent/node going up the tree 
parentNode(name: `string`) : `parentWorker OR nodeWorker` | PARENT & NODE | Get any node going up the tree 
node(key: `number`) : `nodeWorker` | PARENT | Get direct node going down the tree 
getId() : `number` | NODE | Get id of current node worker 
getStatus() : `string` | ALL | Get status of current worker 
getNodeStatus() : `string` | NODE | Get node status of current worker 
getName() : `string` | ALL | Get name of current worker 
getType() : `string` | ALL | Return type of current worker
getNodes() : `array` | PARENT | Return all nodes
getLimit() : `number` | ALL | Return the limit of workers allowed in current workers
getWorkers() : `number` | ALL | Return the number of workers
getWaitingWorkers() : `number` | ALL | Return the number of waiting workers
getRunningWorkers() : `number` | ALL | Return the number of running workers
getTotalWorkers() : `number` | ALL | Return the total number of workers (nodes included)
getTotalWaitingWorkers() : `number` | ALL | Return the total number of workers (nodes included)
getTotalRunningWorkers() : `number` | ALL | Return the total number of workers (nodes included)

## All example

``` js
const babyWorkers = require('baby-workers');

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

// Stack worker 
workers.create('stack', (worker, elem) => {
    setTimeout(() => {
        console.log('stack =>', elem, ' - ', 'my id =>', worker.getId());
        worker.pop();
    }, (~~(Math.random() * 1000)));
}, ['z', 'y', 'x', 'w']).stack(); // mode stack enabled
workers.stack.complete(() => {
    console.log('All "stack" has finished');
});

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

// Run worker in a timeout
workers.create('timeout', (worker) => {
    console.log('Timeout called');
    worker.pop();
}).timeout(1000);

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

// Cancel parent worker
const runMe = workers.create('cancel', (worker) => {
    console.log('Here is never called');
    worker.pop();
});
runMe.cancel();

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
        }, random2)
        .limit(0) // Unlimit worker but if parent have a limit so it take parent limit
        .limit(-1) // Unlimit worker
        .run();

        worker.randomLimit.complete(() => {
            worker.pop();
        });

    }, (~~(Math.random() * 1000)));
}, random).limit(2).run();

// Set errors
workers.create('errorComplete', (worker) => {
    worker.error('Why ?', 'Because you stole my bread dude...')
    worker.pop();
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
```