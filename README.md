# Baby workers Javascript
Execute and manage your code asynchronously with workers, like promise, execute each element of an array or a simple element in callback.
Like thread, you can start and stop your jober where and when you want in your code. You can limit the number of jobers or execute it like a stack.
Do everything asynchronously with baby-workers !

## Install

``` bash
npm install --save baby-workers

``` 

## Last release

Version | Change log | Compatibility
---- | --------- | -----------
2.0.0 | Add map, set, push (data), next, exec, reply and getError functions + fix some bugs | >= 2.0.0
2.0.0 beta | Add promise after run/timeout/interval/stack function + add then/catch callback + catch error in run/timeout/interval/stack callback + add feature to create worker without name | >= 2.0.0
1.0.71 | Add getNodes function | <= 1.0.71

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

``` js
workers.create('MyWorker', (worker, elem) => {
    console.log('|=>', elem);
    worker.pop();
}).map(['a', 'b', 'c', 'd']).run().then(() => { // then is a promise
    console.log('Then');
}).catch(() => { // catch is a promise
    console.log('Catch');
});

workers.create('MyWorker2', (worker, elem) => {
    console.log('|=>', elem);
    worker.pop();
}).set(['a', 'b', 'c', 'd']).run().then(() => { // then is a promise
    console.log('Then');
}).catch(() => { // catch is a promise
    console.log('Catch');
});

workers.then(() => { // then is not a promise
    console.log('Then');
}).catch(() => { // catch is not a promise
    console.log('Catch');
}).complete(() => {
    console.log('Complete');
});

```

## Demos
* [Basic](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/basic.js)
* [Promise](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/promise.js)
* [Stack](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/stack.js)
* [Simulate adding/removing worker](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/add_remove_worker.js)
* [Set delay](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/delay.js)
* [Set interval](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/interval.js)
* [Push](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/push.js)
* [Adding data](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/data.js)
* [Cancel worker](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/cancel.js)
* [Limit workers with a queue](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/limit.js)
* [Set error](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/error.js)
* [All](https://raw.githubusercontent.com/dobobaie/baby-workers/master/examples/all.js)

## Main functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
create(name: `string` or callback: `function`, callback: `function`) : `currentWorker` | ALL | Create a new parent
set(data:  `any`) : `currentWorker` | PARENT | Set data and create a new node
map(data:  `array`) : `currentWorker` | PARENT | Set array and create a new node for each element in the array
push(data: `any`) : `currentWorker` | PARENT | Push a new data and create a new node
error(error: `string`) : `currentWorker` | ALL | Set error in current worker and all parent in the tree
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
limit(maxWorkers: `number = 0`, extra: `boolean = false`) | ALL | Limit the number of workers (`maxWorkers = 0` = unlimited or take limit of parent - `maxWorkers = -1` = unlimited and ignore parent). If `extra = true` is true so maxWorkers is taken ONLY if parent workers limit is full
addWorker() : `currentWorker` | ALL | Add virtual worker (be careful !)
removeWorker() : `currentWorker` | ALL | Remove virtual worker (be careful !)
## Callback functions

Function | Available | Description | Additionnal
---- | --------- | ----------- | -----------
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
flux : `object` | ALL | IS NOT A FUNCTION BUT AN OBJECT !

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
getWorkers() : `number` | ALL | Return the number of workers
getWaitingWorkers() : `number` | ALL | Return the number of waiting workers
getRunningWorkers() : `number` | ALL | Return the number of running workers
getTotalWorkers() : `number` | ALL | Return the total number of workers (nodes included)
getTotalWaitingWorkers() : `number` | ALL | Return the total number of workers (nodes included)
getTotalRunningWorkers() : `number` | ALL | Return the total number of workers (nodes included)
