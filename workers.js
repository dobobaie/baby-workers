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
			CANCEL: 'cancel',
			WAITING: 'waiting',
			RUNNING: 'running',
			FINISH: 'finish',
		},
	};

	Object.values = (typeof(Object.values) !== 'function' ? function(data) {
		return Object.keys(data).map(function(key) {
		   return data[key];
		});
	} : Object.values);

	var $process = function(processName)
	{
		this.flux = {};

		this.create = function(name, callback, data)
		{
			callback = (typeof(name) === 'function' ? name : callback);
			name = (typeof(name) === 'function' ? null : name);

			if (name !== null && (_engine.children[name] !== undefined || _engine.this[name] !== undefined)) {
				return null;
			}
			
			_engine.children[name] = new $process(name);
			_engine.children[name].init(_engine.this, $enum.TYPE.PARENT);
			_engine.children[name].setInfos(callback);

			// deprected, to remove in v2.5.0
			data = (typeof(name) === 'function' ? callback : data);
			if (data !== undefined) {
				console.log('baby-worker : create function => data parameter is deprecated. It will be remove in v2.5.0');
			}
			if (Array.isArray(data) === true) {
				_engine.children[name].map(data);
			} else if (data !== undefined) {
				_engine.children[name].set(data);
			}
			// end

			if (name !== null) {
				_engine.this[name] = _engine.children[name];
			}
			return _engine.children[name];
		}

		this.init = function(parent, type, id)
		{
			_engine.id = id;
			_engine.type = type;
			_engine.parent = parent;

			switch (type)
			{
				case $enum.TYPE.ROOT:
					delete _engine.this.setInfos;
					delete _engine.this.set;
					delete _engine.this.map;

					delete _engine.this.timeout;
					delete _engine.this.interval;
					delete _engine.this.run;
					delete _engine.this.stack;
					
					delete _engine.this.push;
					delete _engine.this.cancel;
					delete _engine.this.node;
					
					delete _engine.this.pop;
					delete _engine.this.root;
					delete _engine.this.parent;
					
					delete _engine.this.back;
			
					delete _engine.this.getId;
					delete _engine.this.getNodeStatus;
				break;
				case $enum.TYPE.PARENT:
					delete _engine.this.pop;
					delete _engine.this.root;
					
					delete _engine.this.getId;
					delete _engine.this.getNodeStatus;
				break;
				case $enum.TYPE.NODE:
					delete _engine.this.setInfos;
					delete _engine.this.set;
					delete _engine.this.map;
					
					delete _engine.this.timeout;
					delete _engine.this.interval;
					delete _engine.this.run;
					delete _engine.this.stack;
					
					delete _engine.this.back;
			
					delete _engine.this.cancel;
					delete _engine.this.push;
					delete _engine.this.node;
				break;
			}
			delete _engine.this.init;
			return _engine.this;
		}

		this.setInfos = function(callback)
		{
			_parent.callback = callback;
			_engine.status = $enum.STATUS.WAITING;
			delete _engine.this.setInfos;
			return _engine.this;
		}

		//-- --//
		this.map = function(arr)
		{
			if (Array.isArray(arr) === false) {
				return _engine.this.set(arr);
			}
			_parent.data = arr;
			return _engine.this;
		}

		this.push = function(data)
		{
			var idElement = _parent.data.push(data) - 1;

			if (_engine.type === $enum.TYPE.PARENT && _engine.status === $enum.STATUS.FINISH) {
				_engine.this.next();
			}
			return _engine.this;
		}

		this.set = function(data)
		{
			_parent.data = [data];
			return _engine.this;
		}

		//-- --//
		this.stack = function()
		{
			_parent.stack.status = true;
			_engine.this.next();

			return new Promise(function(resolve, reject) {
				_engine.this.then(resolve).catch(reject);
			});
		}

		// deprecated, to remove in v2.5.0
		this.timeout = function(time)
		{
			console.log('baby-worker : timeout function is deprecated. It will be remove in v2.5.0');
			return _engine.this.delay(time);
		}
		// end

		this.delay = function(time)
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
			_engine.this.addWorker(true);
			_parent.isInterval = setInterval(function() {
				_engine.this.reply();
			}, time);
			_engine.this.stop = function() {
				_engine.this.removeWorker();
				clearInterval(_parent.isInterval);
			};

			return new Promise(function(resolve, reject) {
				_engine.this.then(resolve).catch(reject);
			});
		}

		this.run = function()
		{
			while (_engine.this.next());
			return _engine.this;
		}

		this.reply = function(idNode)
		{
			if (idNode === undefined) {
				if (_parent.data.length === 0) {
					_parent.data.push(undefined);
				}
				_parent.data.map(function(elem, key) {
					_engine.this.exec(key, true);
				});
				return _engine.this;
			}
			return _engine.this.exec(idNode, true);
		}

		this.next = function()
		{
			_parent.currentSeek += 1;
			if (_engine.this.exec(_parent.currentSeek, false) === null) {
				_parent.currentSeek -= 1;
				return null;
			}
			return _engine.this;
		}

		this.exec = function(idNode, forceId)
		{
			forceId = (typeof(forceId) === 'boolean' ? forceId : true);

			if (_parent.data.length <= idNode) {
				if (idNode !== 0) {
					return null;
				}
				_parent.data.push(undefined);
			}
			
			if (_parent.nodes[idNode] === undefined) {
				var nodeProcess = new $process(_engine.name);
				nodeProcess.init(_engine.this, $enum.TYPE.NODE, idNode);
				_parent.nodes.push(nodeProcess);
				_parent.workers += 1;
			}

			$verifyNodeStatus(idNode, forceId);
			return _engine.this;
		}

		var $verifyNodeStatus = function(idNode, forceId)
		{
			if (_engine.status === $enum.STATUS.CANCEL) {
				return ;
			}

			if (_parent.stack.currentNode + 1 !== idNode && forceId === false) {
				_engine.this.back(function() {
					$execCallback('waiting');
				}, false);
				return $waitingNode(idNode, forceId);
			}

			var parent = $getParentLimit();
			
			if (_parent.limitWorkers > 0 && _parent.limitWorkers <= _parent.runningWorkers) {
				if (_parent.limitExtra ===  false || parent === null || (parent.getLimit() > 0 && parent.getLimit() + _parent.limitWorkers <= parent.getTotalRunningWorkers() + _engine.this.getRunningWorkers())) {
					
					// to opti
					if (_engine.this.getRunningWorkers() === 0 && parent !== null && typeof(parent.back) === 'function') {
						parent.back(function() {
							$execCallback('waiting');
						}, false);
					} else {
						_engine.this.back(function() {
							$execCallback('waiting');
						}, false);
					}
					//

					return $waitingNode(idNode, forceId);
				}
			}

			if (_parent.limitWorkers === 0 && parent !== null && parent.getLimit() > 0 && parent.getLimit() <= parent.getTotalRunningWorkers() + _engine.this.getRunningWorkers()) {
				
				// to opti
				if (_engine.this.getRunningWorkers() === 0 && parent !== null && typeof(parent.back) === 'function') {
					parent.back(function() {
						$execCallback('waiting');
					}, false);
				} else {
					_engine.this.back(function() {
						$execCallback('waiting');
					}, false);
				}
				//

				return $waitingNode(idNode, forceId);
			}

			if (_parent.stack.status === true && _parent.stack.isRunning !== $enum.STATUS.WAITING) {
				_engine.this.back(function() {
					$execCallback('waiting');
				}, false);
				return $waitingNode(idNode, forceId);
			}
			return $execNodeCallback(idNode, forceId);
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

		var $waitingNode = function(idNode, forceId)
		{
			_parent.waitingWorkers += 1;
			_engine.this.addWaitingWorker();
			$on('waiting', function(next) {
				_parent.waitingWorkers -= 1;
				_engine.this.removeWaitingWorker();
				$verifyNodeStatus(idNode, forceId);
			});
			return false;
		}

		var $execNodeCallback = function(idNode, forceId)
		{
			if (forceId === false) {
				_parent.stack.currentNode += 1;
			}

			_parent.runningWorkers += 1;
			_parent.stack.isRunning = $enum.STATUS.RUNNING;
			_parent.nodes[idNode].addWorker(true);
			_parent.nodes[idNode].complete(function() {
				_parent.runningWorkers -= 1;
				if (_parent.stack.status === true && _parent.stack.currentNode < _parent.data.length) {
					_parent.stack.isRunning = $enum.STATUS.WAITING;
					_engine.this.next();
				} else if (_parent.waitingWorkers !== 0) {
					_parent.stack.isRunning = $enum.STATUS.WAITING;
					_engine.this.next();
				} else if (_parent.isInterval === null) {
					_parent.stack.isRunning = $enum.STATUS.FINISH;
				}
			});

			try {
				_parent.callback(_parent.nodes[idNode], _parent.data[idNode]);
			} catch (e) {
				_parent.nodes[idNode].error(e);
			}
			return true;
		}

		//-- --//
		this.limit = function(max, extra)
		{
			_parent.limitExtra = (typeof(extra) === 'boolean' ? extra : false);
			_parent.limitWorkers = (max < -1 ? -1 : max);
			_parent.limitWorkers = (_parent.limitExtra === true && _parent.limitWorkers === -1 ? 0 : _parent.limitWorkers);
			return _engine.this;
		}
		
		this.cancel = function()
		{
			if (_engine.status === $enum.STATUS.FINISH || _engine.status === $enum.STATUS.CANCEL) {
				return null;
			}

			_engine.status = $enum.STATUS.CANCEL;
			// _engine.this.removeWorker();
			return _engine.this;
		}

		//-- --//
		this.error = function(error, isWorker)
		{
			isWorker = (typeof(isWorker) === 'boolean' ? isWorker : true);

			_engine.error = (_engine.error === null ? error : _engine.error);
			if (_engine.parent !== null) {
				_engine.parent.error(_engine.error, false);
			}
			if (isWorker === true) {
				_engine.this.pop();
			}
			return _engine.this;
		}

		this.pop = function()
		{
			if (_engine.nodeStatus !== $enum.STATUS.RUNNING) {
				return null;
			}
			return _engine.this.removeWorker();
		}

		//-- --//
		this.addWorker = function(isWorker)
		{
			isWorker = (typeof(isWorker) === 'boolean' ? isWorker : false);

			_engine.status = $enum.STATUS.RUNNING;

			if (isWorker === false) {
				_engine.totalRunningWorkers += 1;
			} else {
				_engine.nodeStatus = $enum.STATUS.RUNNING;
			}

			// console.log('add', _engine.type, _engine.name, _engine.id, _engine.totalRunningWorkers, _engine.totalWaitingWorkers);

			if (_engine.parent !== null) {
				_engine.parent.addWorker(false);
			}
			return _engine.this;
		}

		this.removeWorker = function(idNode)
		{
			if (idNode === undefined && _engine.type === $enum.TYPE.NODE) {
				_engine.nodeStatus = $enum.STATUS.FINISH;
					
				idNode = _engine.id;

				if (_engine.error !== null) {
					$execCallback('catch');
				} else {
					$execCallback('then');
				}
				$execCallback('complete');
			} else {
				_engine.totalRunningWorkers -= 1;

				if (idNode !== undefined) {
					$execCallback('back', idNode);
				}
				
				if (_engine.totalRunningWorkers === 0 && _engine.totalWaitingWorkers !== 0) {
					$execCallback('waiting');
					_engine.status = $enum.STATUS.WAITING;
				}

				if (_engine.totalRunningWorkers === 0 && _engine.totalWaitingWorkers === 0) {
					
					if (_engine.error !== null) {
						$execCallback('catch');
					} else {
						$execCallback('then');
					}
					$execCallback('complete');

					_engine.status = (_engine.status === $enum.STATUS.CANCEL ? _engine.status : $enum.STATUS.FINISH);
				}
			}

			// console.log('remove', _engine.type, _engine.name, idNode, _engine.totalRunningWorkers, _engine.totalWaitingWorkers);

			if (_engine.parent !== null) {
				_engine.parent.removeWorker(idNode);
			}
			return _engine.this;
		}

		this.addWaitingWorker = function()
		{
			_engine.totalWaitingWorkers += 1;	
					
			if (_engine.parent !== null) {
				_engine.parent.addWaitingWorker();
			}
			return _engine.this;
		}

		this.removeWaitingWorker = function()
		{
			_engine.totalWaitingWorkers -= 1;	
					
			if (_engine.parent !== null) {
				_engine.parent.removeWaitingWorker();
			}
			return _engine.this;
		}

		//-- --//
		this.save = function(name, data)
		{
			if (data === undefined) {
				data = name;
				name = undefined;
			}
			var setDataRec = function(flux, type, search) {
				if (search.length === 0) {
					flux[type] = data;
					return ;
				}
				flux[type] = (flux[type] === undefined ? {} : flux[type]);
				return setDataRec(flux[type], search.splice(0, 1).shift(), search);
			};
			setDataRec(_engine.this, 'flux', (typeof(name) !== 'string' ? [] : name.split('.')));
			return _engine.this;
		}

		this._save = function(name, data)
		{
			var parent = _engine.parent;
			if (parent !== null) {
				parent.save(name, data);
			}
			return _engine.this;
		}

		this.get = function(name)
		{
			var getDataRec = function(flux, type, search) {
				if (search.length === 0) {
					return flux[type];
				}
				flux[type] = (flux[type] === undefined ? {} : flux[type]);
				return getDataRec(flux[type], search.splice(0, 1).shift(), search);
			};
			return getDataRec(_engine.this, 'flux', (typeof(name) !== 'string' ? [] : name.split('.')));
		}

		this._get = function(name)
		{
			var parent = _engine.parent;
			return (parent === null ? null : parent.get(name));
		}

		//-- --//
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

		//-- --//
		this.back = function(callback, removeAfterCall)
		{
			$on('back', callback, removeAfterCall, function(param) {
				return param;
			});
			return _engine.this;
		}

		this.complete = function(callback, removeAfterCall)
		{
			if (_engine.status === $enum.STATUS.FINISH) {
				callback(_engine.error);
				if (typeof(removeAfterCall) !== 'boolean' || removeAfterCall == true) {
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
			if (_engine.status === $enum.STATUS.FINISH && _engine.error === null) {
				callback(_engine.this.flux);
				if (typeof(removeAfterCall) !== 'boolean' || removeAfterCall == true) {
					return _engine.this;
				}
			}
			$on('then', callback, removeAfterCall, function() {
				return _engine.this.flux;
			});
			return _engine.this;
		}

		this.catch = function(callback, removeAfterCall)
		{
			if (_engine.status === $enum.STATUS.FINISH && _engine.error !== null) {
				callback(_engine.error);
				if (typeof(removeAfterCall) !== 'boolean' || removeAfterCall == true) {
					return _engine.this;
				}
			}
			$on('catch', callback, removeAfterCall, function() {
				return _engine.error;
			});
			return _engine.this;
		}

		var $on = function(type, callback, removeAfterCall, param)
		{
			removeAfterCall = (typeof(removeAfterCall) === 'boolean' ? removeAfterCall : true);
			param = (typeof(param) === 'function' ? param : null);

			_engine.callback.push({
				type: type,
				callback: callback,
				removeAfterCall: removeAfterCall,
				param: param,
			});
			return _engine.this;
		}

		var $execCallback = function(type, param)
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
				copyCallback[index].callback((typeof(copyCallback[index].param) === 'function' ? copyCallback[index].param(param) : copyCallback[index].param));
			}
		}

		//-- --//
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

		this.getError = function()
		{
			return _engine.error;
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
			return _parent.nodes.length;
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

		//-- --//
		var _parent = {
			limitWorkers: 0,
			limitExtra: false,
			wasRejected: false,
			isInterval: null,
			nodes: [],
			workers: 0,
			runningWorkers: 0,
			waitingWorkers: 0,
			data: [],
			callback: null,
			stack: {
				status: false,
				currentNode: -1,
				isRunning: $enum.STATUS.WAITING,
			},
			currentSeek: -1,
		};

		var _engine = {
			this: this,
			id: null,
			name: processName,
			parent: null,
			status: $enum.NONE,
			nodeStatus: $enum.NONE,
			type: $enum.NONE,
			error: null,
			children: {},
			callback: [],
			totalRunningWorkers: 0,
			totalWaitingWorkers: 0,
		};
	}

	var process = new $process('root');
	return process.init(null, $enum.TYPE.ROOT);
}

try { module.exports = Workers; } catch (e) {}