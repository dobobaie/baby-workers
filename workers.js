var Workers = function()
{
	var $enum = {
		NONE: null,
		TYPE: {
			ROOT: 'root',
			PARENT: 'parent',
			NODE: 'node',
		},
		STATUS: {
			WAITING: 'waiting',
			RUNNING: 'running',
			FINISH: 'finish',
		},
	};

	Object.values = (typeof(Object.values) != 'function' ? function(data) {
		return Object.keys(data).map(function(key) {
		   return data[key];
		});
	} : Object.values);

	var $process = function(processName)
	{
		this.create = function(name, callback, data)
		{
			data = (typeof(name) === 'function' ? callback : data);
			callback = (typeof(name) === 'function' ? name : callback);
			name = (typeof(name) === 'function' ? null : name);

			if (name !== null && (_engine.children[name] !== undefined || _engine.this[name] !== undefined)) {
				return null;
			}
			
			_engine.children[name] = new $process(name);
			_engine.children[name].init(_engine.this, $enum.TYPE.PARENT);
			_engine.children[name].set(callback, data);

			if (name !== null) {
				_engine.this[name] = _engine.children[name];
			}
			return _engine.children[name];
		}

		this.init = function(parent, type, id)
		{
			_engine.parent = parent;
			_engine.type = type;
			_engine.id = id;
			switch (type)
			{
				case $enum.TYPE.ROOT:
					delete _engine.this.push;
					delete _engine.this.cancel;
					delete _engine.this.getId;
					delete _engine.this.timeout;
					delete _engine.this.interval;
					delete _engine.this.run;
					delete _engine.this.stack;
					delete _engine.this.pop;
					delete _engine.this.set;
					delete _engine.this.parent;
					delete _engine.this.root;
					delete _engine.this.node;
					delete _engine.this.getNodeStatus;
				break;
				case $enum.TYPE.PARENT:
					delete _engine.this.getId;
					delete _engine.this.pop;
					delete _engine.this.root;
					delete _engine.this.getNodeStatus;
				break;
				case $enum.TYPE.NODE:
					delete _engine.this.push;
					delete _engine.this.cancel;
					delete _engine.this.timeout;
					delete _engine.this.interval;
					delete _engine.this.run;
					delete _engine.this.stack;
					delete _engine.this.node;
				break;
			}
			delete _engine.this.init;
			return _engine.this;
		}

		this.set = function(callback, data)
		{
			data = (data === null && data !== undefined ? [] : (Array.isArray(data) == false || data[0] == undefined ? [data] : Object.values(data)));
			for (var index in data) {
				var nodeProcess = new $process(_engine.name);
				nodeProcess.init(_engine.this, $enum.TYPE.NODE, index);
				_parent.nodes.push(nodeProcess);
				_parent.workers += 1;
			}
			_parent.data = data;
			_parent.callback = callback;
			_engine.status = $enum.STATUS.WAITING;
			_engine.this.addWorker();
			delete _engine.this.set;
			return _engine.this;
		}

		this.stack = function()
		{
			_parent.stack.status = true;
			_engine.this.run();

			return new Promise(function(resolve, reject) {
				_engine.this.then(resolve).catch(reject);
			});
		}

		this.timeout = function(time)
		{
			time = (time == null || typeof(time) != 'number' ? 1 : time);
			setTimeout(_engine.this.run, time);

			return new Promise(function(resolve, reject) {
				_engine.this.then(resolve).catch(reject);
			});
		}

		this.interval = function(time)
		{
			time = (time == null || typeof(time) != 'number' ? 1000 : time);
			_parent.haveInterval = setInterval(_engine.this.run, time);
			_engine.this.stop = function() {
				_engine.this.removeWorker(false);
				clearInterval(_parent.haveInterval);
			};

			return new Promise(function(resolve, reject) {
				_engine.this.then(resolve).catch(reject);
			});
		}

		this.run = function()
		{
			_engine.status = $enum.STATUS.RUNNING;
			
			for (var index in _parent.data) {
				$verifyNodeStatus(index);
			}

			if (_parent.haveInterval == null) {
				_engine.this.removeWorker(false);
			}

			if (_parent.runningWorkers === 0 && _parent.waitingWorkers === 0 && _engine.status === $enum.STATUS.RUNNING) {
				_engine.status = $enum.STATUS.FINISH;
			}
	
			return new Promise(function(resolve, reject) {
				_engine.this.then(resolve).catch(reject);
			});
		}

		var $verifyNodeStatus = function(index)
		{
			if (_parent.stack.status === true && _parent.stack.currentNode === parseInt(index) && _parent.stack.isRunning === $enum.STATUS.WAITING) {
				$execNodeCallback(index, true);
				return ;
			} else if (_parent.stack.status === true) {
				_engine.this.waiting($waitingNodeCallback(index), true, true);
				return ;
			}

			if (_parent.stack.currentNode > parseInt(index)) {
				_engine.this.waiting($waitingNodeCallback(index), true, true);
				return ;
			}

			if (_parent.limitWorkers > 0 && _parent.limitWorkers <= _parent.runningWorkers && _parent.limitExtra === false) {
				_engine.this.waiting($waitingNodeCallback(index), true, true);
				return ;
			}

			var parent =  $getParentLimit();
			if ((_parent.limitWorkers === 0 || _parent.limitExtra === true) && parent != null && parent.getLimit() > 0 && parent.getLimit() <= parent.getTotalRunningWorkers() + _engine.this.getRunningWorkers()) {
				if (parent.getLimit() + (_parent.limitExtra == true ? _parent.limitWorkers : 0) <= parent.getTotalRunningWorkers() + _engine.this.getRunningWorkers()) {
					parent.waiting($waitingNodeCallback(index), true, true);
					return ;
				}
			}

			$execNodeCallback(index);
		}

		var $getParentLimit = function(parent)
		{
			if (parent === undefined && _engine.parent != null) {
				return $getParentLimit(_engine.parent);
			}
			if (parent !== undefined && parent.getLimit() === 0 && typeof(parent.root) === 'function') {
				return $getParentLimit(parent.root());
			}
			return parent;
		}

		var $waitingNodeCallback = function(index)
		{
			return function(next) {
				$verifyNodeStatus(index);
				next();
			}
		}

		var $execNodeCallback = function(index, continueNode)
		{
			if (continueNode === false) {
				_parent.stack.currentNode += 1;
			}
			_parent.runningWorkers += 1;
			_parent.nodes[index].addWorker(true, true);
			_parent.stack.isRunning = $enum.STATUS.RUNNING;
			
			try {
				_parent.callback(_parent.nodes[index], _parent.data[index]);
			} catch (e) {
				_parent.nodes[index].error(e);
				_parent.nodes[index].pop();
			}
		}

		this.push = function(data)
		{
			if (data == null) {
				return _engine.this;
			}

			var index = _parent.data.push(data) - 1;
			var nodeProcess = new $process(_engine.name);
			nodeProcess.init(_engine.this, $enum.TYPE.NODE, index);
			_parent.nodes.push(nodeProcess);
			_parent.workers += 1;

			_engine.status = $enum.STATUS.RUNNING;
			$verifyNodeStatus(index);

			return _engine.this;
		}

		this.cancel = function()
		{
			_engine.this.removeWorker(true, true);
			return _engine.this;
		}

		this.pop = function()
		{
			if (_engine.nodeStatus == $enum.STATUS.FINISH) {
				return ;
			}

			_engine.totalWorkers -= 1;
			if (_engine.totalWorkers === 0 && _engine.totalWaitingWorkers === 0) {
				if (_engine.error !== null) {
					$execCallback('catch');
				} else {
					$execCallback('then');
				}
				$execCallback('complete');
			}
			_engine.parent.removeWorker(true, true);
			return _engine.this;
		}

		this.limit = function(max, extra)
		{
			_parent.limitExtra = (typeof(extra) !== 'boolean' || extra === false ? false : true);
			_parent.limitWorkers = (max < -1 ? -1 : max);
			_parent.limitWorkers = (_parent.limitExtra === true && _parent.limitWorkers === -1 ? 0 : _parent.limitWorkers);
			return _engine.this;
		}
		
		this.addWorker = function(isParent, isRunning)
		{
			if (typeof(isParent) === 'boolean' && isParent === true) {
				_engine.nodeStatus = $enum.STATUS.RUNNING;
			}

			if (typeof(isRunning) === 'boolean' && isRunning === true) {
				_engine.totalRunningWorkers += 1;
			}

			_engine.totalWorkers += 1;
			if (_engine.parent !== null) {
				_engine.parent.addWorker(false, isRunning);
			}
			return _engine.this;
		}

		this.removeWorker = function(isParent, isRunning)
		{
			if (typeof(isParent) === 'boolean' && isParent === true) {
				_parent.workers -= 1;
				_parent.runningWorkers -= 1;
				_engine.status = $enum.STATUS.FINISH;
				_engine.nodeStatus = $enum.STATUS.FINISH;
				if (_parent.stack.status === true) {
					_parent.stack.currentNode += 1;
					_parent.stack.isRunning = $enum.STATUS.WAITING;
				}
			}

			if (typeof(isRunning) === 'boolean' && isRunning === true) {
				_engine.totalRunningWorkers -= 1;
			}
	
			_engine.totalWorkers -= 1;

			if (_parent.waitingWorkers !== 0) {
				$execCallback('waiting');
			}

			if (_engine.totalWorkers === 0 && _engine.totalWaitingWorkers === 0) {
				if (_engine.error !== null) {
					$execCallback('catch');
				} else {
					$execCallback('then');
				}
				$execCallback('complete');
			}
			
			if (_engine.parent !== null) {
				_engine.parent.removeWorker(false, isRunning);
			}
			return _engine.this;
		}

		this.removeWaitingWorker = function()
		{
			_engine.totalWaitingWorkers -= 1;
			
			if (_engine.totalWorkers === 0 && _engine.totalWaitingWorkers === 0) {
				if (_engine.error !== null) {
					$execCallback('catch');
				} else {
					$execCallback('then');
				}
				$execCallback('complete');
			}
					
			if (_engine.parent != null) {
				_engine.parent.removeWaitingWorker();
				return _engine.this;
			}
			return _engine.this;
		}

		this.error = function(error)
		{
			_engine.error = (_engine.error === null ? error : _engine.error);
			if (_engine.parent !== null) {
				_engine.parent.error(error);
			}
			return _engine.this;
		}

		this.save = function(data)
		{
			_engine.save = data;
			return _engine.this;
		}

		this._save = function(data)
		{
			var parent = _engine.parent;
			if (parent !== null) {
				parent.save(data);
			}
			return _engine.this;
		}

		this.get = function()
		{
			return _engine.save;
		}

		this._get = function()
		{
			var parent = _engine.parent;
			return (parent == null ? parent : parent.get());
		}

		this.root = function()
		{
			return _engine.parent;
		}

		this.parent = function(name, type)
		{
			if (_engine.parent == null) {
				return null;
			}
			type = (type == undefined ? $enum.TYPE.PARENT : type);
			if (_engine.parent.getName() === name && (type === $enum.NONE || _engine.parent.getType() === type)) {
				return _engine.parent;
			}
			if (_engine.parent.parent === undefined) {
				return null;
			}
			return _engine.parent.parent(name, type);
		}

		this.parentNode = function(name)
		{
			return _engine.this.parent(name, $enum.TYPE.NODE);
		}

		this.node = function(key)
		{
			return (_parent.nodes[key] == undefined ? null : _parent.nodes[key]);
		}

		this.waiting = function(callback, removeAfterCall, isParent)
		{
			_engine.totalWaitingWorkers += 1;
			if (typeof(isParent) === 'boolean' && isParent === true) {
				_parent.waitingWorkers += 1;
				$on('waiting', function(next) {
					_parent.waitingWorkers -= 1;
					callback(next);
				}, removeAfterCall, function() {
					return _engine.this.removeWaitingWorker;
				});
			}
			if (_engine.parent != null) {
				_engine.parent.waiting(callback, removeAfterCall, false);
				return _engine.this;
			}
			return _engine.this;
		}

		this.complete = function(callback, removeAfterCall)
		{
			if (_engine.totalWorkers === 0) {
				callback(_engine.error);
				if (typeof(removeAfterCall) != 'boolean' || removeAfterCall == true) {
					return _engine.this;
				}
			}
			$on('complete', callback, removeAfterCall, function() {
				return _engine.error;
			});
			return _engine.this;
		}

		this.then = function(callback, removeAfterCall)
		{
			if (_engine.totalWorkers === 0 && _engine.error === null) {
				callback(_engine.save);
				if (typeof(removeAfterCall) != 'boolean' || removeAfterCall == true) {
					return _engine.this;
				}
			}
			$on('then', callback, removeAfterCall, function() {
				return _engine.save;
			});
			return _engine.this;
		}

		this.catch = function(callback, removeAfterCall)
		{
			if (_engine.totalWorkers === 0 && _engine.error !== null) {
				callback(_engine.error);
				if (typeof(removeAfterCall) != 'boolean' || removeAfterCall == true) {
					return _engine.this;
				}
			}
			$on('catch', callback, removeAfterCall, function() {
				return _engine.error;
			});
			return _engine.this;
		}

		var $on = function(type, callback, removeAfterCall, params)
		{
			_engine.callback.push({
				type: type,
				callback: callback,
				removeAfterCall: removeAfterCall,
				params: params,
			});
			return _engine.this;
		}

		var $execCallback = function(type)
		{
			var copyCallback = _engine.callback;
			_engine.callback = [];
			for (var index in copyCallback) {
				if (copyCallback[index].type !== type) {
					_engine.callback.push(copyCallback[index]);
					continue ;
				}
				if (typeof(copyCallback[index].removeAfterCall) == 'boolean' && copyCallback[index].removeAfterCall == false) {
					_engine.callback.push(copyCallback[index]);
				}
				copyCallback[index].callback(copyCallback[index].params());
			}
		}

		this.getName = function()
		{
			return _engine.name;
		}

		this.getType = function()
		{
			return _engine.type;
		}

		this.getId = function()
		{
			return _engine.id;
		}

		this.getStatus = function()
		{
			return _engine.status;
		}

		this.getNodeStatus = function()
		{
			return _engine.nodeStatus;
		}

		this.getLimit = function()
		{
			return _parent.limitWorkers;
		}

		this.getWorkers = function()
		{
			return _parent.workers;
		}

		this.getWaitingWorkers = function()
		{
			return _parent.waitingWorkers;
		}

		this.getRunningWorkers = function()
		{
			return _parent.runningWorkers;
		}

		this.getTotalWorkers = function()
		{
			return _engine.totalWorkers;
		}

		this.getTotalWaitingWorkers = function()
		{
			return _engine.totalWaitingWorkers;
		}

		this.getTotalRunningWorkers = function()
		{
			return _engine.totalRunningWorkers;
		}

		this.getNodes = function()
		{
			return _parent.nodes;
		}

		var _parent = {
			limitWorkers: 0,
			limitExtra: false,
			wasRejected: false,
			haveInterval: null,
			nodes: [],
			workers: 0,
			runningWorkers: 0,
			waitingWorkers: 0,
			data: [],
			callback: null,
			stack: {
				status: false,
				currentNode: 0,
				isRunning: $enum.STATUS.WAITING,
			},
		};

		var _engine = {
			this: this,
			id: null,
			name: processName,
			parent: null,
			status: $enum.NONE,
			nodeStatus: $enum.NONE,
			type: $enum.NONE,
			save: null,
			error: null,
			children: {},
			callback: [],
			totalWorkers: 0,
			totalRunningWorkers: 0,
			totalWaitingWorkers: 0,
		};
	}

	var process = new $process('root');
	return process.init(null, $enum.TYPE.ROOT);
}

try { module.exports = Workers; } catch (e) {}