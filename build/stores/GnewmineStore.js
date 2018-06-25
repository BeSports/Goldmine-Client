'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _descriptor2, _descriptor3, _descriptor4;

var _mobx = require('mobx');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _deepDiff = require('deep-diff');

var _deepDiff2 = _interopRequireDefault(_deepDiff);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _index = require('axios/index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

    _initDefineProp(this, 'containers', _descriptor4, this);

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
    value: function initiateSubscription(publicationNameWithParams) {
      var _this = this;

      var headers = {};
      if (this.headers) {
        headers = _lodash2.default.merge(headers, this.headers);
      }

      var options = {
        url: process.env.GNEWMINE_SERVER,
        headers: headers,
        method: 'POST',
        data: {
          subscriptions: [publicationNameWithParams]
        },
        mode: 'cors'
      };

      (0, _index2.default)(options).then(function (response) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('GNM init', publicationNameWithParams, response.data);
        }
        // add the new subscription its data
        var index = _lodash2.default.findIndex(_this.subscriptions, { publicationNameWithParams: publicationNameWithParams });

        if (index > -1) {
          _this.subscriptions[index] = _lodash2.default.merge({}, _this.subscriptions[index], {
            data: response.data,
            loaded: true
          });
        }
        _this.updateContainers(publicationNameWithParams, _this.containers);
      });

      var channel = this.socket.subscribe(this.toPusherName(publicationNameWithParams));
      channel.bind('update', function (data) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('GNM update', publicationNameWithParams, data.diff);
        }
        _this.setDifference(publicationNameWithParams, data.diff);
        _this.updateContainers(publicationNameWithParams, _this.containers);
      });
    }
  }, {
    key: 'setSocket',
    value: function setSocket(socket) {
      this.socket = socket;
    }
  }, {
    key: 'setHeaders',
    value: function setHeaders(headers) {
      this.headers = headers;
    }
  }, {
    key: 'setDifference',
    value: function setDifference(publicationNameWithParams, differences) {
      var index = _lodash2.default.findIndex(this.subscriptions, { publicationNameWithParams: publicationNameWithParams });

      if (index) {
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
}), _descriptor4 = _applyDecoratedDescriptor(_class.prototype, 'containers', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return [];
  }
}), _applyDecoratedDescriptor(_class.prototype, 'subscribe', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'subscribe'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'cancelSubscription', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'cancelSubscription'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'initiateSubscription', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'initiateSubscription'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setSocket', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setSocket'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setHeaders', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setHeaders'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'setDifference', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'setDifference'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'registerWithGnewmine', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'registerWithGnewmine'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'cancelWithGnewmine', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'cancelWithGnewmine'), _class.prototype)), _class);
exports.default = new GnewmineStore();