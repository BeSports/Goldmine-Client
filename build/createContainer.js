'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _mobx = require('mobx');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _PubSubStore = require('./stores/PubSubStore');

var _PubSubStore2 = _interopRequireDefault(_PubSubStore);

var _DataStore = require('./stores/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

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

/**
 * Sub container:
 *
 * Can dispatch actions to the stores.
 *
 * @param requests
 * @param Component
 * @returns {*}
 */
exports.default = function (requests, Component) {
  var _desc, _value, _class;

  return _class = function (_React$PureComponent) {
    _inherits(SubContainer, _React$PureComponent);

    function SubContainer(props) {
      _classCallCheck(this, SubContainer);

      var _this = _possibleConstructorReturn(this, (SubContainer.__proto__ || Object.getPrototypeOf(SubContainer)).call(this, props));

      _this.addSubToRecentCheck = _this.addSubToRecentCheck.bind(_this);
      _this.cancelSubscriptionsWithoutRecentCheck = _this.cancelSubscriptionsWithoutRecentCheck.bind(_this);
      _this.subs = {};
      _this.garbageCollectorRunning = false;
      _this.dataProps = props;
      _this.loaders = 0;
      _this.recentChecks = [];
      return _this;
    }

    _createClass(SubContainer, [{
      key: 'componentWillMount',
      value: function componentWillMount() {
        var _this2 = this;

        this.setState({
          loaders: this.loaders
        });
        _PubSubStore2.default.registerSubContainer(this);
        this.doAutoRun = function () {
          if (!_this2.garbageCollectorRunning) {
            var temp = requests(_this2, _this2.dataProps);
            temp['loaders'] = _this2.getLoadersFromSubscriptions;
            temp['data'] = _this2.getDataObject;
            _this2.setState(temp);
            if (_lodash2.default.has(_this2, 'props.onLoaded') && _lodash2.default.has(_this2, 'props.limit') && _this2.getLoadersFromSubscriptions === 0) {
              _this2.props.onLoaded(_lodash2.default.sum(_lodash2.default.map(_this2.getLimitedDataObject, _lodash2.default.size)) >= _this2.props.limit);
            }
          }
        };

        this.doAutoRun();
      }
    }, {
      key: 'componentWillReceiveProps',
      value: function componentWillReceiveProps(nextProps) {
        var _this3 = this;

        if (JSON.stringify(nextProps) !== JSON.stringify(this.props)) {
          // Run changes in transaction.
          // When transaction is complete the necessary updates will take place.
          (0, _mobx.runInAction)(function () {
            _this3.recentChecks = [];
            _this3.dataProps = nextProps;
            var temp = requests(_this3, _this3.dataProps);
            _this3.setState(temp);
            _this3.cancelSubscriptionsWithoutRecentCheck();
          });
        }
      }
    }, {
      key: 'componentWillUnmount',
      value: function componentWillUnmount() {
        var copySubs = Object.assign({}, this.subs);
        _PubSubStore2.default.cancelSubContainer(this);
        this.cancelSubscriptions();
        delete this.doAutoRun;
      }
    }, {
      key: 'cancelSubscriptionsWithoutRecentCheck',
      value: function cancelSubscriptionsWithoutRecentCheck() {
        var _this4 = this;

        _lodash2.default.forEach(this.subs, function (isReactive, publicationNameWithParams) {
          if (!_lodash2.default.includes(_this4.recentChecks, publicationNameWithParams)) {
            _PubSubStore2.default.cancelSubscription(publicationNameWithParams);
            delete _this4.subs[publicationNameWithParams];
          }
        });
        this.recentChecks = [];
      }
    }, {
      key: 'render',
      value: function render() {
        var ToRender = Component || this.dataProps.component;
        return _react2.default.createElement(ToRender, _extends({}, this.state, { options: this.props.options }, this.props));
      }
    }, {
      key: 'addSubToRecentCheck',
      value: function addSubToRecentCheck(publicationNameWithParams) {
        this.recentChecks = _lodash2.default.concat(this.recentChecks, publicationNameWithParams);
      }
    }, {
      key: 'subscribe',
      value: function subscribe(publicationName, params, isReactive) {
        var publicationNameWithParams = publicationName + '?' + this.buildParams(params);
        //to not be deleted
        this.addSubToRecentCheck(publicationNameWithParams);
        if (this.subs.hasOwnProperty(publicationNameWithParams)) {
          return;
        }

        // Notify store
        _PubSubStore2.default.subscribe(publicationNameWithParams, isReactive);

        // Sub container tracks his subs
        this.subs[publicationNameWithParams] = isReactive;

        // Increment loaders
        this.loaders++;
      }

      /**
       * Convert params object to string for subscription name.
       *
       * @param params
       * @returns {string}
       */

    }, {
      key: 'buildParams',
      value: function buildParams(params) {
        var buildParams = '';
        var x = 0;

        var size = Object.keys(params).length - 1;

        _lodash2.default.forEach(params, function (value, key) {
          var tempValue = JSON.stringify(value);
          buildParams += key + '=' + tempValue;

          if (x < size) {
            buildParams += '&';
          }

          x++;
        });

        return buildParams;
      }

      /**
       * Cancels all subscriptions for the sub container.
       */

    }, {
      key: 'cancelSubscriptions',
      value: function cancelSubscriptions() {
        var _this5 = this;

        _lodash2.default.forEach(this.subs, function (isReactive, publicationNameWithParams) {
          _PubSubStore2.default.cancelSubscription(publicationNameWithParams);
          delete _this5.subs[publicationNameWithParams];
        });
      }

      /**
       * Returns the MobX data store.
       *
       * @returns {DataStore}
       */

    }, {
      key: 'getCollection',


      /**
       * Returns a specific collection from the data store.
       *
       * @param collectionName
       */
      value: function getCollection(collectionName) {
        _DataStore2.default.createCollectionIfNotExists(collectionName);

        return _DataStore2.default.collections[collectionName];
      }

      /**
       * Cleans the data store for a given publication.
       *
       * @param subs
       */

    }, {
      key: 'garbageCollector',
      value: function garbageCollector(subs) {
        _lodash2.default.forEach(subs, function (isReactive, publicationNameWithParams) {
          _DataStore2.default.garbageCollector(publicationNameWithParams);
        });
      }
    }, {
      key: 'getLimitedDataObject',
      get: function get() {
        var _this6 = this;

        return _lodash2.default.pickBy(_lodash2.default.mapValues((0, _mobx.toJS)(_DataStore2.default.collections), function (collection, collectionName) {
          if (_lodash2.default.has(_this6.dataProps, 'collectionToLoadMore') && _this6.dataProps.collectionToLoadMore !== collectionName) {
            return [];
          }
          return _lodash2.default.filter(_lodash2.default.map(collection, function (value) {
            if (_lodash2.default.size(_lodash2.default.intersection(value['__publicationNameWithParams'], _lodash2.default.keys(_this6.subs)))) {
              return value;
            }
            return undefined;
          }), function (o) {
            return !!o;
          });
        }), _lodash2.default.size);
      }
    }, {
      key: 'getDataObject',
      get: function get() {
        var _this7 = this;

        return _lodash2.default.pickBy(_lodash2.default.mapValues((0, _mobx.toJS)(_DataStore2.default.collections), function (collection) {
          return _lodash2.default.filter(_lodash2.default.map(collection, function (value) {
            if (_lodash2.default.size(_lodash2.default.intersection(value['__publicationNameWithParams'], _lodash2.default.keys(_this7.subs)))) {
              return value;
            }
            return undefined;
          }), function (o) {
            return !!o;
          });
        }), _lodash2.default.size);
      }
    }, {
      key: 'getLoadersFromSubscriptions',
      get: function get() {
        var _this8 = this;

        var subsForContainer = _lodash2.default.filter(_PubSubStore2.default.subs, function (s) {
          return _lodash2.default.find(_lodash2.default.keys(_this8.subs), function (subName) {
            return subName === s.publicationNameWithParams;
          });
        });
        return _lodash2.default.sumBy(subsForContainer, 'loaders');
      }
    }, {
      key: 'getDataStore',
      get: function get() {
        return _DataStore2.default;
      }
    }]);

    return SubContainer;
  }(_react2.default.PureComponent), (_applyDecoratedDescriptor(_class.prototype, 'subscribe', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'subscribe'), _class.prototype)), _class;
};