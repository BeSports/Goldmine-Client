'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4, _descriptor5, _descriptor6, _descriptor7;

var _mobx = require('mobx');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _deepDiff = require('deep-diff');

var _deepDiff2 = _interopRequireDefault(_deepDiff);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
  var desc = {};
  Object['ke' + 'ys'](descriptor).forEach(function (key) {
    desc[key] = descriptor[key];
  });
  desc.enumerable = !!desc.enumerable;
  desc.configurable = !!desc.configurable;

  if ('value' in desc || desc.initializer) {
    desc.writable = true;
  }

  desc = decorators.slice().reverse().reduce(function (desc, decorator) {
    return decorator(target, property, desc) || desc;
  }, desc);

  if (context && desc.initializer !== void 0) {
    desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
    desc.initializer = undefined;
  }

  if (desc.initializer === void 0) {
    Object['define' + 'Property'](target, property, desc);
    desc = null;
  }

  return desc;
}

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var GnewmineStore = (_class = function () {
  function GnewmineStore() {
    _classCallCheck(this, GnewmineStore);

    _initDefineProp(this, 'subscriptions', _descriptor, this);

    _initDefineProp(this, 'socket', _descriptor2, this);

    _initDefineProp(this, 'headers', _descriptor3, this);

    _initDefineProp(this, 'userId', _descriptor4, this);

    _initDefineProp(this, 'host', _descriptor5, this);

    _initDefineProp(this, 'disconnected', _descriptor6, this);

    _initDefineProp(this, 'containers', _descriptor7, this);

    this.primaryKey = '';
  }

  /**
   * Subscribes to a publication.
   *
   * @param publicationNameWithParams
   * @param isReactive
   */


  _createClass(GnewmineStore, [{
    key: 'subscribe',
    value: function subscribe(publicationNameWithParams) {
      var sub = _lodash2.default.find(this.subscriptions, { publicationNameWithParams: publicationNameWithParams });
      if (sub === undefined) {
        this.subscriptions.push({ publicationNameWithParams: publicationNameWithParams, loaded: false, times: 1 });
        this.initiateSubscription(publicationNameWithParams);
      } else {
        var newTimes = sub.times + 1;
        this.subscriptions[_lodash2.default.findIndex(this.subscriptions, { publicationNameWithParams: publicationNameWithParams })] = _lodash2.default.merge({}, sub, { times: newTimes });
      }
    }

    /**
     * Cancels a subscription for a publication.
     *
     * @param publicationNameWithParams
     */

  }, {
    key: 'cancelSubscription',
    value: function cancelSubscription(publicationNameWithParams) {
      var sub = _lodash2.default.find(this.subscriptions, { publicationNameWithParams: publicationNameWithParams });
      if (sub) {
        if (sub.times === 1) {
          var index = _lodash2.default.findIndex(this.subscriptions, { publicationNameWithParams: publicationNameWithParams });
          this.subscriptions.splice(index, 1);
          this.socket.unsubscribe(this.toPusherName(publicationNameWithParams));
        } else if (sub.times >= 2) {
          var newTimes = sub.times - 1;
          this.subscriptions[_lodash2.default.findIndex(this.subscriptions, { publicationNameWithParams: publicationNameWithParams })] = _lodash2.default.merge({}, sub, { times: newTimes });
        }
      }
    }
  }, {
    key: 'initiateSubscription',
    value: function () {
      var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(publicationNameWithParams) {
        var _this = this;

        var data, index, channel;
        return regeneratorRuntime.wrap(function _callee$(_context) {
          while (1) {
            switch (_context.prev = _context.next) {
              case 0:
                _context.next = 2;
                return this.getSubscriptionDataFromApi(publicationNameWithParams);

              case 2:
                data = _context.sent;


                // add the new subscription its data
                index = _lodash2.default.findIndex(this.subscriptions, { publicationNameWithParams: publicationNameWithParams });


                if (index > -1) {
                  this.subscriptions[index] = _lodash2.default.merge({}, this.subscriptions[index], {
                    data: data,
                    loaded: true
                  });
                }
                this.updateContainers(publicationNameWithParams, this.containers);

                channel = this.socket.subscribe(this.toPusherName(publicationNameWithParams));

                channel.bind('update', function (newData) {
                  if (process.env.NODE_ENV !== 'production') {
                    console.log('GNM update', publicationNameWithParams, newData.diff);
                  }
                  _this.setDifference(publicationNameWithParams, newData.diff);
                  _this.updateContainers(publicationNameWithParams, _this.containers);
                });

              case 8:
              case 'end':
                return _context.stop();
            }
          }
        }, _callee, this);
      }));

      function initiateSubscription(_x) {
        return _ref.apply(this, arguments);
      }

      return initiateSubscription;
    }()
  }, {
    key: 'getSubscriptionDataFromApi',
    value: function () {
      var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(publicationNameWithParams) {
        var headers, options, response;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                headers = {};

                if (this.headers) {
                  headers = _lodash2.default.merge(headers, this.headers);
                }

                options = {
                  url: this.host || process.env.GNEWMINE_SERVER,
                  headers: headers,
                  method: 'POST',
                  data: {
                    subscriptions: [publicationNameWithParams]
                  },
                  mode: 'cors'
                };
                _context2.next = 6;
                return (0, _axios2.default)(options);

              case 6:
                response = _context2.sent;

                if (process.env.NODE_ENV !== 'production') {
                  console.log('GNM (re)init', publicationNameWithParams, response.data);
                }
                return _context2.abrupt('return', response.data);

              case 11:
                _context2.prev = 11;
                _context2.t0 = _context2['catch'](0);

                console.log('Couldnt connect to api', _context2.t0);
                return _context2.abrupt('return', null);

              case 15:
              case 'end':
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 11]]);
      }));

      function getSubscriptionDataFromApi(_x2) {
        return _ref2.apply(this, arguments);
      }

      return getSubscriptionDataFromApi;
    }()
  }, {
    key: 'reinitSubscription',
    value: function () {
      var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(publicationNameWithParams) {
        var data, index;
        return regeneratorRuntime.wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                _context3.next = 2;
                return this.getSubscriptionDataFromApi(publicationNameWithParams);

              case 2:
                data = _context3.sent;


                // add the new subscription its data
                index = _lodash2.default.findIndex(this.subscriptions, { publicationNameWithParams: publicationNameWithParams });


                if (index > -1) {
                  this.subscriptions[index] = {
                    publicationNameWithParams: this.subscriptions[index].publicationNameWithParams,
                    times: this.subscriptions[index].times,
                    data: data,
                    loaded: true
                  };
                }
                this.updateContainers(publicationNameWithParams, this.containers);

              case 6:
              case 'end':
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function reinitSubscription(_x3) {
        return _ref3.apply(this, arguments);
      }

      return reinitSubscription;
    }()
  }, {
    key: 'setSocket',
    value: function setSocket(socket) {
      this.socket = socket;
    }
  }, {
    key: 'setHeaders',
    value: function setHeaders(headers) {
      if (!this.headers || headers['x-access-token'] !== this.headers['x-access-token']) {
        this.headers = headers;
        this.triggerAll(this.containers);
      }
    }
  }, {
    key: 'setUserId',
    value: function setUserId(userId) {
      if (userId !== this.userId) {
        this.userId = userId;
        this.triggerAll(this.containers);
      }
    }
  }, {
    key: 'setHost',
    value: function setHost(host) {
      if (host !== this.host) {
        this.host = host;
        this.triggerAll(this.containers);
      }
    }
  }, {
    key: 'setDisconnected',
    value: function setDisconnected(disconnected) {
      var _this2 = this;

      if (disconnected !== this.disconnected && disconnected) {
        var oldContainers = _lodash2.default.slice(this.containers);
        _lodash2.default.forEach(oldContainers, function (container) {
          _lodash2.default.forEach(container.subs, function (sub) {
            if (sub) {
              _this2.reinitSubscription(sub);
            }
          });
        });
      }
      this.disconnected = disconnected;
    }
  }, {
    key: 'setDifference',
    value: function setDifference(publicationNameWithParams, differences) {
      var index = _lodash2.default.findIndex(this.subscriptions, { publicationNameWithParams: publicationNameWithParams });

      if (index >= 0) {
        var newData = (0, _mobx.toJS)(this.subscriptions[index].data);
        _lodash2.default.each(differences, function (singleDiff) {
          _deepDiff2.default.applyChange(newData, {}, singleDiff);
        });
        this.subscriptions[index] = _lodash2.default.merge({}, _lodash2.default.omit(this.subscriptions[index], 'data'), {
          data: newData
        });
      }
    }
  }, {
    key: 'updateContainers',
    value: function updateContainers(publicationNameWithParams, containers) {
      _lodash2.default.forEach((0, _mobx.toJS)(containers), function (container) {
        if (container && container.subs && _lodash2.default.includes((0, _mobx.toJS)(container.subs), publicationNameWithParams)) {
          container.doAutoRun();
        }
      });
    }
  }, {
    key: 'triggerAll',
    value: function triggerAll(containers) {
      _lodash2.default.forEach((0, _mobx.toJS)(containers), function (container) {
        container.doAutoRun();
      });
    }
  }, {
    key: 'toPusherName',
    value: function toPusherName(subscriptionName) {
      var publicationName = this.extractPublicationName(subscriptionName);
      var key = subscriptionName.indexOf('?');
      var params = subscriptionName.substring(key + 1);
      var encodedParamsString = _base2.default.encode(params);
      var pusherName = publicationName + '_' + encodedParamsString;
      return pusherName;
    }
  }, {
    key: 'extractPublicationName',
    value: function extractPublicationName(subscription) {
      var key = subscription.indexOf('?');
      var roomName = subscription;
      if (key !== -1) {
        roomName = subscription.substring(0, key);
      }
      return roomName;
    }
  }, {
    key: 'registerWithGnewmine',
    value: function registerWithGnewmine(container) {
      this.containers.push(container);
    }
  }, {
    key: 'cancelWithGnewmine',
    value: function cancelWithGnewmine(container) {
      var index = _lodash2.default.findIndex(this.containers, container);
      this.containers.splice(index, 1);
    }
  }]);

  return GnewmineStore;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'subscriptions', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'socket', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor3 = _applyDecoratedDescriptor(_class.prototype, 'headers', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'userId', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor5 = _applyDecoratedDescriptor(_class.prototype, 'host', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return null;
  }
}), _descriptor6 = _applyDecoratedDescriptor(_class.prototype, 'disconnected', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return false;
  }
}), _descriptor7 = _applyDecoratedDescriptor(_class.prototype, 'containers', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return [];
  }
}), _applyDecoratedDescriptor(_class.prototype, 'subscribe', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'subscribe'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'cancelSubscription', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'cancelSubscription'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'initiateSubscription', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'initiateSubscription'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'getSubscriptionDataFromApi', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'getSubscriptionDataFromApi'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'reinitSubscription', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'reinitSubscription'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setSocket', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setSocket'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setHeaders', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setHeaders'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setUserId', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setUserId'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setHost', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setHost'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setDisconnected', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setDisconnected'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setDifference', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setDifference'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'registerWithGnewmine', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'registerWithGnewmine'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'cancelWithGnewmine', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'cancelWithGnewmine'), _class.prototype)), _class);
exports.default = new GnewmineStore();