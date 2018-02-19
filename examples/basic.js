const babyWorkers = require('../workers');

const workers = new babyWorkers;

// Console Time
console.time('time');

// Promises worker
async function testProcess()
{
	await workers.create('MyWorker', (worker, elem) => {
	  
		worker.create((worker, elemTest) => {
			worker.pop();
		}).set(elem).delay(~~(Math.random() * 1000));

		worker.then(() => {
			console.log(elem, 'is then');
		}).catch(() => {
			console.log(elem, 'is catch');
		}).complete(() => {
			worker.pop();
			console.log(elem, 'is complete');
		});

	}).map(['a', 'b', 'c', 'd']).run().then((data) => {
		console.log('Unknown Promises then', data);
	}).catch((data) => {
		console.log('Unknown Promises catch', data);
	});

	console.log('Unknown is done');
}

testProcess();

workers.MyWorker.complete(() => {
	console.log('Unknown outside is done');
});

// Worker without name and exec specific node
var a = workers.create((worker, elemTest) => {
	console.log(elemTest);
	worker.pop();
}).set('ExecMe').push('ExecMeToo');

a.exec(0);
a.exec(1);

// Worker with name and next
workers.create('MyName', (worker, elemTest) => {
	console.log(elemTest);
	worker.pop();
}).push('NextMeToo');

workers.MyName.next();
workers.MyName.next();


// Reply nodes
workers.MyName.reply(0);
a.reply(1);

// Worker with map and run
workers.create((worker, elemTest) => {
	console.log(elemTest);
	worker.pop();
}).map(['RunMe', 'RunMeToo']).run();

workers.create('ututututu', (worker) => {
	worker.create((worker) => {
		worker.pop();
	}).run().then(() => {
		console.log('================================> Promises success');
	});
	worker.create((worker) => {
		worker.error();
	}).run().catch(() => {
		console.log('================================> Promises error');
	});
	worker.complete(() => {
		worker.pop();
		console.log('================================> Promises done');
	});
}).run();

workers.create((worker, elem) => {
	console.log(elem, '=>', worker.getId());
	setTimeout(() => {
		worker.pop();
	}, 1000);
}).limit(2).map(['ws', 'ww', 'wf', 'wx', 'wq', 'wz', 'wa']).run();

// All workers has finish
workers.complete((error) => {
	 console.log('All "workers" has finished', 'maybe some errors ?', error);

	 // Console Time
	 console.timeEnd('time');
});



/*
	A AJOUTER :

	delay
	map
	set
	push

	reply
	getError
	back **
	createAsync | runAsync | stackAsync
*/