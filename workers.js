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

		this.init = function(parent, type)
		{
			_engine.parent = parent;
			_engine.type = type;
			switch (type)
			{
				case $enum.TYPE.ROOT:
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
					delete _engine.this.pop;
					delete _engine.this.root;
				break;
				case $enum.TYPE.NODE:
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
			data = (data == null || typeof(data) != 'object' || data[0] == undefined ? [data] : Object.values(data));
			for (var index in data) {
				var nodeProcess = new $process(_engine.name);
				nodeProcess.init(_engine.this, $enum.TYPE.NODE);
				_parent.nodes.push(nodeProcess);
				_parent.worker += 1;
			}
			_parent.data = data;
			_parent.callback = callback;
			_engine.status = $enum.STATUS.WAITING;
			_engine.totalWorkers = 1;
			delete _engine.this.set;
			return _engine.this;
		}

		this.stack = function()
		{
			_parent.stack.status = true;
			_engine.this.run();
			delete _engine.this.stack;
			return _engine.this;
		}

		this.timeout = function(time)
		{
			time = (time == null || typeof(time) != 'number' ? 1 : time);
			_engine.this.addWorker();
			setTimeout(function() {
				_engine.this.run();
				_engine.this.removeWorker(false);
			}, time);
			delete _engine.this.timeout;
			return _engine.this;
		}

		this.interval = function(time)
		{
			time = (time == null || typeof(time) != 'number' ? 1000 : time);
			_engine.this.addWorker();
			var currentInterval = setInterval(_engine.this.run, time);
			_engine.this.stop = function() {
				_engine.this.removeWorker(false);
				clearInterval(currentInterval);
			};
			delete _engine.this.interval;
			return _engine.this;
		}

		this.run = function()
		{
			_engine.status = $enum.STATUS.RUNNING;
			for (var index in _parent.data) {
				if (_parent.stack.status === true && (_parent.stack.isRunning === $enum.STATUS.RUNNING || _parent.stack.currentNode !== parseInt(index))) {
					continue;
				}
				_parent.nodes[index].addWorker();
				_parent.stack.isRunning = $enum.STATUS.RUNNING;
				_parent.callback(_parent.nodes[index], _parent.data[index]);
			}
			if (_parent.stack.currentNode == 0) {
				_engine.totalWorkers -= 1;
			}
			return _engine.this;
		}

		this.pop = function()
		{
			_engine.totalWorkers -= 1;
			if (_engine.totalWorkers === 0) {
				$execCompleteCallback();
			}
			_engine.parent.removeWorker(true);
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

		this.getStatus = function()
		{
			return _engine.status;
		}

		this.addWorker = function()
		{
			_engine.totalWorkers += 1;
			if (_engine.parent !== null) {
				_engine.parent.addWorker();
			}
			return _engine.this;
		}

		this.removeWorker = function(isParent)
		{
			if (typeof(isParent) === 'boolean' && isParent === true) {
				_parent.worker -= 1;
				_engine.status = $enum.STATUS.FINISH;
				if (_parent.stack.status === true) {
					_parent.stack.currentNode += 1;
					_parent.stack.isRunning = $enum.STATUS.WAITING;
					_engine.this.run();
				}
			}

			_engine.totalWorkers -= 1;
			if (_engine.totalWorkers === 0) {
				$execCompleteCallback();
			}
			
			if (_engine.parent !== null) {
				_engine.parent.removeWorker(false);
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

		var $execCompleteCallback = function()
		{
			var newList = [];
			for (var index in _engine.completeCallback) {
				if (typeof(_engine.completeCallback[index].removeAfterCall) == 'boolean' && _engine.completeCallback[index] == false) {
					newList.push(_engine.completeCallback[index]);
				}
				_engine.completeCallback[index].callback(_engine.error);
			}
			_engine.completeCallback = newList;
		}

		var _parent = {
			nodes: [],
			worker: 0,
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
			name: processName,
			parent: null,
			status: $enum.NONE,
			type: $enum.NONE,
			save: null,
			error: null,
			fatalError: null,	
			children: {},
			completeCallback: [],
			totalWorkers: 0,
		};
	}

	var process = new $process('root');
	return process.init(null, $enum.TYPE.ROOT);
}

module.exports = Workers;
