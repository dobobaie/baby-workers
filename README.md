# Workers Javascript
Manage your functions asynchronously or as stack/timeout/interval/queue with baby-workers.

## Install

``` bash
npm install --save baby-workers

``` 

## Usage
Create as much workers that you need, for a simple function or for each element of an array, they will be executed in specific callback !
Plus, It's like Thread in another language you can control all workers and limit the number of execute of asynchronous functions.

``` js
const workers = new babyWorkers;
 
const workers = new babyWorkers;
 
// Basic worker
workers.create('basic', (worker, elem) => {
    setTimeout(() => {
        console.log('basic =>', elem, ' - ', 'my id =>', worker.getId());
        worker.pop();
    }, (~~(Math.random() * 1000)));
}, ['a', 'b', 'c', 'd']).run();
workers.basic.complete(() => {
    console.log('All "basic" has finished');
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

// Run worker in a setInterval
workers.create('interval', (worker) => {
    console.log('Interval called');
    worker.save(worker.get() + 1);
    worker.pop();

    if (worker.get() == 5) {
        workers.interval.stop();
    }
}).save(0).interval(1000);

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
workers.complete((error, fatalError) => {
     console.log('All "workers" has finished', 'maybe some errors ?', error, fatalError);
});
```

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
create(name: `string`, callback: `function`, data: `any = undefined`) : `currentWorker` | ALL | Create a new worker
run() : `currentWorker` | PARENT | Run current worker
stack() : `currentWorker` | PARENT | Run nodes like stack 
timeout(time: `number = 1`) : `currentWorker` | PARENT | Run nodes like run in setTimeout 
interval(time: `number = 1000`) : `currentWorker` | PARENT | Run nodes like run in setInterval | stop() : `currentWorker`, NODE, Stop interval 
cancel() : `currentWorker` | PARENT | Cancel current instance and execute complete callback 
limit | ROOT & PARENT | Limit the number of workers as running
pop() : `currentWorker` | NODE | Stop current node
addWorker() : `currentWorker` | ALL | Add virtual worker in current worker (it used for external asynch function) 
removeWorker(isParent: `boolean`) : `currentWorker` | ALL | Remove virtual worker in current worker (it used for external asynch function) 
complete(callback: `function`, removeAfterCall: `boolean`) : `currentWorker` | ALL | Call function when current process is finish (node, parent => when childrens are finish or root => when childrens are finish) 
error(error: `string`, fatalError: `string`) : `currentWorker` | ALL | Set error in current worker and all parent in the tree
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
getName() : `string` | ALL | Get name of current worker 
getType() : `string` | ALL | Return type of current worker
getWorkers : `number` | ALL | Return the number of workers
getWaitingWorkers : `number` | ALL | Return the number of waiting workers
getRunningWorkers : `number` | ALL | Return the number of running workers
getTotalWorkers : `number` | ALL | Return the total number of workers (nodes included)
getTotalWaitingWorkers : `number` | ALL | Return the total number of workers (nodes included)
getTotalRunningWorkers : `number` | ALL | Return the total number of workers (nodes included)

## Exemples 2

``` js
const request = require('request');
const babyWorkers = require('baby-workers');

class Main
{
	constructor()
	{
		this.workers = new babyWorkers;
		
		this.workers.create('users', this.getUser, ['58bdza054dre58a9dra56', 'ddz548ftbc5045dee87rr']).save([]).run();
		this.workers.users.complete((error) => {
			if (error !== null) {
				return ;
			}
			console.log('Users:', this.workers.users.get());
		});
		
		this.workers.create('articles', this.getArticles, ['45dz54dez50dez84fzsd', 'bvc0b4b8fdfdg48dfgfd1', 'd48d4z0g4v8cx4q8sc4q']).save([]).run();
		this.workers.articles.complete((error) => {
			if (error !== null) {
				return ;
			}
			console.log('Articles:', this.workers.articles.get());
		});
		
		this.workers.complete((error, fatalError) => {
			if (error !== null) {
				console.log(error);
				console.error(fatalError);
				return ;
			}
			console.log('All workers has finished');
		});
	}

	getUser(worker, idUser)
	{
		request({
			url: urlGetUser + idUser,
		}, (error, response, body) => {
			if (error !== null) {
				worker.error('Get user ' + idUser + ' error', error);
				return worker.pop();
			}
			worker.save(body); // to get idUser from getBillUser
			worker.create('notifyUser', this.putNotifyUser, idUser).run();
			worker.create('billUser', this.getBillUser, body.data.bills).save([]).run();
			worker.billUser.complete(() => {
				worker.root().save(worker.root().get().concat([{
firstName: body.data.firstName,
lastName: body.data.lastName,
bills: worker.billUser.get(),
				}]));
				worker.pop();
			});
		});
	}

	putNotifyUser(worker, idUser)
	{
		request({
			url: urlNotifyUser + idUser,
		}, (error, response, body) => {
			if (error !== null) {
				worker.error('Notify user ' + idUser + ' error', error);
			}
			worker.pop();
		});
	}

	getBillUser(worker, idBill)
	{
		request({
			url: urlGetBillUser + idBill,
		}, (error, response, body) => {
			if (error !== null) {
				const idUser = worker.root().get().idUser; // previously saved from getUser
				worker.error('Billd user ' + idUser + ' error', error);
			} else {
				worker.root().save(worker.root().get().concat([{
name: body.data.name,
					amount: body.data.amount,
				}]));
			}
			worker.pop();
		});
	}

	getArticles(worker, idArticle)
	{
		request({
			url: urlGetArticle + idArticle,
		}, (error, response, body) => {
			if (error !== null) {
				worker.error('Article ' + idArticle + ' error', error);
			} else {
				worker.root().save(worker.root().get().concat([{
					title: body.data.title,
					content: body.data.content,
				}]));
			}
			worker.pop();
		});
	}
}

module.exports = new Main;
```
