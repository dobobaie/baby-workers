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
			if (_engine.children[name] !== undefined || _engine.this[name] !== undefined) {
				return null;
			}
			_engine.children[name] = new $process(name);
			_engine.children[name].init(_engine.this, $enum.TYPE.PARENT);
			_engine.children[name].set(callback, data);
			_engine.this[name] = _engine.children[name];
			return _engine.this[name];
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
				break;
				case $enum.TYPE.PARENT:
					delete _engine.this.getId;
					delete _engine.this.pop;
					delete _engine.this.root;
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

			delete _engine.this.stack;
			delete _engine.this.timeout;
			delete _engine.this.interval;
			return _engine.this;
		}

		this.timeout = function(time)
		{
			time = (time == null || typeof(time) != 'number' ? 1 : time);
			setTimeout(_engine.this.run, time);

			delete _engine.this.stack;
			delete _engine.this.timeout;
			delete _engine.this.interval;
			return _engine.this;
		}

		this.interval = function(time)
		{
			time = (time == null || typeof(time) != 'number' ? 1000 : time);
			_parent.haveInterval = setInterval(_engine.this.run, time);
			_engine.this.stop = function() {
				_engine.this.removeWorker(false);
				clearInterval(_parent.haveInterval);
			};

			delete _engine.this.stack;
			delete _engine.this.timeout;
			delete _engine.this.interval;
			return _engine.this;
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
	
			delete _engine.this.stack;
			delete _engine.this.timeout;
			delete _engine.this.interval;
			return _engine.this;
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
			_parent.nodes[index].addWorker(true);
			_parent.stack.isRunning = $enum.STATUS.RUNNING;
			_parent.callback(_parent.nodes[index], _parent.data[index]);
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
			_engine.totalWorkers -= 1;
			if (_engine.totalWorkers === 0 && _engine.totalWaitingWorkers === 0) {
				$execCompleteCallback();
			}
			_engine.parent.removeWorker(true, true);
			return _engine.this;
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

		this.limit = function(max, extra)
		{
			_parent.limitExtra = (typeof(extra) !== 'boolean' || extra === false ? false : true);
			_parent.limitWorkers = (max < -1 ? -1 : max);
			_parent.limitWorkers = (_parent.limitExtra === true && _parent.limitWorkers === -1 ? 0 : _parent.limitWorkers);
			return _engine.this;
		}
		
		this.waiting = function(callback, removeAfterCall, isParent)
		{
			_engine.totalWaitingWorkers += 1;
			if (typeof(isParent) === 'boolean' && isParent === true) {
				_parent.waitingWorkers += 1;
				_engine.waitingCallback.push({
					callback: function(next) {
						_parent.waitingWorkers -= 1;
						callback(next);
					},
					removeAfterCall: removeAfterCall,
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
				callback(_engine.error, _engine.fatalError);
				if (typeof(removeAfterCall) != 'boolean' || removeAfterCall == true) {
					return _engine.this;
				}
			}
			_engine.completeCallback.push({
				callback: callback,
				removeAfterCall: removeAfterCall,
			});
			return _engine.this;
		}

		this.addWorker = function(isRunning)
		{
			if (typeof(isRunning) === 'boolean' && isRunning === true) {
				_engine.totalRunningWorkers += 1;
			}

			_engine.totalWorkers += 1;
			if (_engine.parent !== null) {
				_engine.parent.addWorker(isRunning);
			}
			return _engine.this;
		}

		this.removeWorker = function(isParent, isRunning)
		{
			if (typeof(isParent) === 'boolean' && isParent === true) {
				_parent.workers -= 1;
				_parent.runningWorkers -= 1;
				_engine.status = $enum.STATUS.FINISH;
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
				$execWaitingCallback();
			}

			if (_engine.totalWorkers === 0 && _engine.totalWaitingWorkers === 0) {
				$execCompleteCallback();
			}
			
			if (_engine.parent !== null) {
				_engine.parent.removeWorker(false, isRunning);
			}
			return _engine.this;
		}

		this.error = function(error, fatalError)
		{
			_engine.error = (_engine.error === null ? error : _engine.error);
			_engine.fatalError = (_engine.fatalError === null ? fatalError : _engine.fatalError);
			if (_engine.parent !== null) {
				_engine.parent.error(error, fatalError);
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
			return (parent == null ? parent : parent.save(data));
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
			return (_engine.nodes[key] == undefined ? null : _engine.nodes[key]);
		}

		this.removeWaitingWorker = function()
		{
			_engine.totalWaitingWorkers -= 1;
			
			if (_engine.totalWorkers === 0 && _engine.totalWaitingWorkers === 0) {
				$execCompleteCallback();
			}
					
			if (_engine.parent != null) {
				_engine.parent.removeWaitingWorker();
				return _engine.this;
			}
			return _engine.this;
		}

		var $execWaitingCallback = function()
		{
			var copyCallback = _engine.waitingCallback;
			_engine.waitingCallback = [];
			for (var index in copyCallback) {
				if (typeof(copyCallback[index].removeAfterCall) == 'boolean' && copyCallback[index].removeAfterCall == false) {
					_engine.waitingCallback.push(copyCallback[index]);
				}
				copyCallback[index].callback(_engine.this.removeWaitingWorker);
			}
		}

		var $execCompleteCallback = function()
		{
			var copyCallback = _engine.completeCallback;
			_engine.completeCallback = [];
			for (var index in copyCallback) {
				if (typeof(copyCallback[index].removeAfterCall) == 'boolean' && copyCallback[index].removeAfterCall == false) {
					_engine.completeCallback.push(copyCallback[index]);
				}
				copyCallback[index].callback(_engine.error, _engine.fatalError);
			}
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
			type: $enum.NONE,
			save: null,
			error: null,
			fatalError: null,
			children: {},
			completeCallback: [],
			waitingCallback: [],
			totalWorkers: 0,
			totalRunningWorkers: 0,
			totalWaitingWorkers: 0,
		};
	}

	var process = new $process('root');
	return process.init(null, $enum.TYPE.ROOT);
}

module.exports = Workers;
