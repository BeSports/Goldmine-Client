'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor, _descriptor2;

var _mobx = require('mobx');

var _mobx2 = _interopRequireDefault(_mobx);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _DataStore = require('./DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

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

var PubSubStore = (_class = function () {
  function PubSubStore() {
    _classCallCheck(this, PubSubStore);

    _initDefineProp(this, 'subs', _descriptor, this);

    _initDefineProp(this, 'subContainers', _descriptor2, this);
  }

  _createClass(PubSubStore, [{
    key: 'subscribe',


    /**
     * Subscribes to a publication.
     *
     * @param publicationNameWithParams
     * @param isReactive
     */
    value: function subscribe(publicationNameWithParams, isReactive) {
      var sub = _lodash2.default.find(this.subs, { publicationNameWithParams: publicationNameWithParams });
      if (sub === undefined) {
        this.subs.push({ publicationNameWithParams: publicationNameWithParams, isReactive: isReactive, loaders: 1, times: 1 });
      } else {
        var newTimes = sub.times + 1;
        this.subs[_lodash2.default.findIndex(this.subs, { publicationNameWithParams: publicationNameWithParams })] = _lodash2.default.merge({}, sub, { times: newTimes });
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
      var sub = _lodash2.default.find(this.subs, { publicationNameWithParams: publicationNameWithParams });
      if (sub) {
        if (sub.times === 1) {
          var index = _lodash2.default.findIndex(this.subs, { publicationNameWithParams: publicationNameWithParams });
          this.subs.splice(index, 1);
          _DataStore2.default.garbageCollector(publicationNameWithParams);
        } else if (sub.times >= 2) {
          var newTimes = sub.times - 1;
          this.subs[_lodash2.default.findIndex(this.subs, { publicationNameWithParams: publicationNameWithParams })] = _lodash2.default.merge({}, sub, { times: newTimes });
        }
      }
    }
  }, {
    key: 'registerSubContainer',
    value: function registerSubContainer(subContainer) {
      this.subContainers.push(subContainer);
    }
  }, {
    key: 'cancelSubContainer',
    value: function cancelSubContainer(subContainer) {
      var index = _lodash2.default.findIndex(this.subContainers, subContainer);
      this.subContainers.splice(index, 1);
    }
  }]);

  return PubSubStore;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'subs', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return [];
  }
}), _descriptor2 = _applyDecoratedDescriptor(_class.prototype, 'subContainers', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return [];
  }
}), _applyDecoratedDescriptor(_class.prototype, 'subscribe', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'subscribe'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'cancelSubscription', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'cancelSubscription'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'registerSubContainer', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'registerSubContainer'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'cancelSubContainer', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'cancelSubContainer'), _class.prototype)), _class);
exports.default = new PubSubStore();