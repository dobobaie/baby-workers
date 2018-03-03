# Baby workers Javascript
Execute and manage your code asynchronously with workers and promise. Execute each element of an array or a simple element in callback.
Like thread, you can start and stop your jober where and when you want in your code. You can limit the number of jobers or execute it like a stack.
Do everything asynchronously with baby-workers !

## Install

``` bash
npm install --save baby-workers

``` 

## How is it works ?

Three entites :
* Root (instancied at the start of baby-wokers is the root level)
* Parent (parent instance is created after a worker.create to create nodes)
* Node (node instance created from parent is an independent function it can create a parent too).

[Root] -> worker.create(...) -> [Parent] -> .map(['...', '...']) or .set(...) -> .run() or .stack() or [...] -> [Node] + [Node] 

## Usage

* First create a new parent with workers.create(name or function, function)
* Next set data or map array with workers.name.map([...]) or workers.name.set(...)
* Then run parent to create nodes with workers.name.run() or workers.name.stack() or [...]

``` javascript
workers.create('MyWorker', (worker, elem) => {
    setTimeout(() => {
        console.log('|=>', elem);
        worker.pop();
    }, (~~(Math.random() * 1000)));
}).map(['a', 'b', 'c', 'd']).limit(2).run().then(() => { // then is a promise
    console.log('Then MyWorker');
}).catch(() => { // catch is a promise
    console.log('Catch MyWorker');
});

workers.create('MyWorker2', (worker, elem) => {
    setTimeout(() => {
        console.log('|=>', elem);
        worker.pop();
    }, (~~(Math.random() * 1000)));
}).set(['a', 'b', 'c', 'd']).run().then(() => { // then is a promise
    console.log('Then MyWorker2');
}).catch(() => { // catch is a promise
    console.log('Catch MyWorker2');
});

workers.all(workers.MyWorker, workers.MyWorker2).then(() => { // then is a promise
    console.log('Then workers all');
}).catch(() => { // catch is a promise
    console.log('Catch workers all');
});

workers.then(() => { // then is not a promise
    console.log('Then workers');
}).catch(() => { // catch is not a promise
    console.log('Catch workers');
}).complete(() => {
    console.log('Complete workers');
});

```

## Demos
* [Basic](https://github.com/dobobaie/baby-workers/wiki/Basic)
* [Promise](https://github.com/dobobaie/baby-workers/wiki/Promise)
* [Stack](https://github.com/dobobaie/baby-workers/wiki/Stack)
* [Simulate adding/removing worker](https://github.com/dobobaie/baby-workers/wiki/RemoveWorker-AddWorker)
* [Set delay](https://github.com/dobobaie/baby-workers/wiki/Delay)
* [Set interval](https://github.com/dobobaie/baby-workers/wiki/Interval)
* [Push](https://github.com/dobobaie/baby-workers/wiki/Push)
* [Adding data](https://github.com/dobobaie/baby-workers/wiki/Data)
* [Cancel worker](https://github.com/dobobaie/baby-workers/wiki/Cancel)
* [Limit workers with a queue](https://github.com/dobobaie/baby-workers/wiki/Limit)
* [Set error](https://github.com/dobobaie/baby-workers/wiki/Error)
* [All](https://github.com/dobobaie/baby-workers/wiki/All)

## Main functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
create(name: `string` or callback: `function`, callback: `function`) : `currentWorker` | ROOT & NODE | Create a new parent
set(data:  `any`) : `currentWorker` | PARENT | Set data and create a new node
map(data:  `array`) : `currentWorker` | PARENT | Set array and create a new node for each element in the array
push(data: `any`) : `currentWorker` | PARENT | Push a new data and create a new node
error(error: `string`) : `currentWorker` | NODE | Set error in current worker and all parent in the tree
pop() : `currentWorker` | NODE | Stop current node
run() : `Promise` | PARENT | Create and run nodes

## Other way to run worker

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
stack() : `Promise` | PARENT | Create and run nodes like a stack
next() : `Promise` | PARENT | Create and run the next node
exec(idNode: `number`) : `Promise` | PARENT | Create and run a specific node
reply(idNode: `number = undefined`) : `Promise` | PARENT | Reply a node or all nodes if idNode is undefined
delay(time: `number = 1`) : `Promise` | PARENT | Create and run nodes in a timeout
interval(time: `number = 1000`) : `Promise` | PARENT | Create and run nodes in an interval | stop() : `currentWorker`, NODE, Stop interval 

## Configuration functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
cancel() : `currentWorker` | PARENT | Cancel parent worker
limit(maxWorkers: `number = 0`, extra: `boolean = false`) | ALL | Limit the number of workers (`maxWorkers = 0` = unlimited or take limit of parent - `maxWorkers = -1` = unlimited and ignore parent limit). If `extra = true` add extra limit ONLY IF PARENT WORKER IS FULL
addWorker() : `currentWorker` | ALL | Add virtual worker (it's like create a fake worker without callback)
removeWorker() : `currentWorker` | ALL | Remove virtual worker (it's like pop a fake worker)

## Callback functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
all(...: `Promise` or `Name of parent worker` or `Parent worker` or `Any`) : `Promise` | ROOT | It's like `all` function in Promise, the difference is this function add a virtual worker and remove it after all elements has finished 
complete(callback: `function`, removeAfterCall: `boolean`) : `currentWorker` | ALL | Call function when current process is finish (node, parent => when childrens are finish or root => when childrens are finish) 
then(callback: `function`, removeAfterCall: `boolean`) : `currentWorker` | ALL | Call function when current process is finish without error
catch(callback: `function`, removeAfterCall: `boolean`) : `currentWorker` | ALL | Call function when current process is finish with error 

## Data manager functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
save(data: `any`) : `currentWorker` | ALL | Save any data in current worker (node, parent or root) 
_save(data: `any`) : `currentWorker` | ALL | Save any data in current worker (node, parent or root) from root
get() : `any` | ALL | Get data previously saved 
_get() : `any` | ALL | Get data previously saved from root 
flux : `object` | ALL | IT'S THE MAIN OBJECT, all data has saved here

## Search functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
root() : `parentWorker` | NODE | Get root/parent of current worker 
parent(name: `string`, type: `string = 'parent'`) : `parentWorker OR nodeWorker` | PARENT & NODE | Get any parent/node going up the tree 
parentNode(name: `string`) : `parentWorker OR nodeWorker` | PARENT & NODE | Get any node going up the tree 
node(key: `number`) : `nodeWorker` | PARENT | Return a node from parent 

## Get functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
getId() : `number` | NODE | Return id/key/index of node
getStatus() : `string` | ALL | Return global status
getError : `string` | ALL | Return error
getNodeStatus() : `string` | NODE | Return the status of node
getName() : `string` | ALL | Return name
getType() : `string` | ALL | Return type of current worker
getNodes() : `array` | PARENT | Return all nodes
getLimit() : `number` | ALL | Return the limit of workers allowed in current workers
getPromise() : `Promise` | Parent | Return the promise of parent worker
getWorkers() : `number` | ALL | Return the number of workers
getWaitingWorkers() : `number` | ALL | Return the number of waiting workers
getRunningWorkers() : `number` | ALL | Return the number of running workers
getTotalWorkers() : `number` | ALL | Return the total number of workers (nodes included)
getTotalWaitingWorkers() : `number` | ALL | Return the total number of workers (nodes included)
getTotalRunningWorkers() : `number` | ALL | Return the total number of workers (nodes included)
