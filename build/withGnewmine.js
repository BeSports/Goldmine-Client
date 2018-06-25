'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _deepDiff = require('deep-diff');

var _deepDiff2 = _interopRequireDefault(_deepDiff);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _GnewmineStore = require('./stores/GnewmineStore');

var _GnewmineStore2 = _interopRequireDefault(_GnewmineStore);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _mobx = require('mobx');

var _mobx2 = require('mobx/lib/mobx');

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

var withGnewmine = function withGnewmine(Component, subscriptions) {
  return function (props) {
    return _react2.default.createElement(WithGnewmine, _extends({}, props, { Component: Component, subscriptions: subscriptions }));
  };
};

var WithGnewmine = (_class = function (_React$Component) {
  _inherits(WithGnewmine, _React$Component);

  function WithGnewmine() {
    _classCallCheck(this, WithGnewmine);

    var _this = _possibleConstructorReturn(this, (WithGnewmine.__proto__ || Object.getPrototypeOf(WithGnewmine)).call(this));

    _this.applyUpdate = _this.applyUpdate.bind(_this);
    _this.buildParams = _this.buildParams.bind(_this);
    _this.getSubscriptionsToSend = _this.getSubscriptionsToSend.bind(_this);
    _this.toPusherName = _this.toPusherName.bind(_this);
    _this.extractPublicationName = _this.extractPublicationName.bind(_this);
    _this.doGnewMine = _this.doGnewMine.bind(_this);
    _this.checkSubscriptions = _this.checkSubscriptions.bind(_this);
    _this.cancelSubscriptionsWithoutRecentCheck = _this.cancelSubscriptionsWithoutRecentCheck.bind(_this);

    _this.state = {
      loaded: false,
      data: {}
    };
    _this.subs = [];
    return _this;
  }

  _createClass(WithGnewmine, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.doGnewMine(nextProps, this.props);
    }
  }, {
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this2 = this;

      _GnewmineStore2.default.registerWithGnewmine(this);
      this.doAutoRun = function () {
        _this2.doGnewMine(_this2.props, {});
      };
      this.doAutoRun();
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.cancelSubscriptionsWithoutRecentCheck();
      _GnewmineStore2.default.cancelWithGnewmine(this);
    }
  }, {
    key: 'doGnewMine',
    value: function doGnewMine(nextProps, prevProps) {
      var _this3 = this;

      if (JSON.stringify(nextProps) !== JSON.stringify(prevProps)) {
        // Run changes in transaction.
        // When transaction is complete the necessary updates will take place.
        (0, _mobx.runInAction)(function () {
          _this3.recentChecks = [];
          _this3.nextProps = nextProps;
          var subscriptionsToSend = _this3.getSubscriptionsToSend(nextProps);
          if (_this3.subs !== subscriptionsToSend) {
            _this3.checkSubscriptions(subscriptionsToSend);
            _this3.cancelSubscriptionsWithoutRecentCheck();
          }
          _this3.setState({
            data: _this3.getDataObject,
            loaded: _this3.getLoaded
          });
        });
      }
    }

    // checks all subscriptions for new subscrtiptions

  }, {
    key: 'checkSubscriptions',
    value: function checkSubscriptions(subscriptionsToSend) {
      var _this4 = this;

      _lodash2.default.forEach(subscriptionsToSend, function (publicationNameWithParams) {
        _this4.recentChecks = _lodash2.default.concat(_this4.recentChecks, publicationNameWithParams);
        if (_lodash2.default.includes(_this4.subs, publicationNameWithParams)) {
          // was already subscribed
          return;
        }
        _GnewmineStore2.default.subscribe(publicationNameWithParams);
        _this4.subs.push(publicationNameWithParams);
      });
    }

    // removes all subscriptions which were not needed anymore

  }, {
    key: 'cancelSubscriptionsWithoutRecentCheck',
    value: function cancelSubscriptionsWithoutRecentCheck() {
      var _this5 = this;

      _lodash2.default.forEach(this.subs, function (publicationNameWithParams) {
        if (!_lodash2.default.includes(_this5.recentChecks, publicationNameWithParams)) {
          _GnewmineStore2.default.cancelSubscription(publicationNameWithParams);
          delete _this5.subs[_lodash2.default.indexOf(_this5.subs, publicationNameWithParams)];
        }
      });
      this.recentChecks = [];
    }
  }, {
    key: 'getSubscriptionsToSend',
    value: function getSubscriptionsToSend(props) {
      var _this6 = this;

      var subscriptionsFunction = props.subscriptions;

      var subscriptions = subscriptionsFunction(props);
      var subscriptionsToSend = _lodash2.default.map(subscriptions, function (subscription) {
        return subscription.publication + '?' + _this6.buildParams(subscription.props);
      });

      return subscriptionsToSend;
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
  }, {
    key: 'applyUpdate',
    value: function applyUpdate(differences) {
      var newData = _lodash2.default.cloneDeep(this.state.data);
      _lodash2.default.each(differences, function (singleDiff) {
        _deepDiff2.default.applyChange(newData, {}, singleDiff);
      });
      this.setState({
        data: newData
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var Component = this.props.Component;
      var _state = this.state,
          data = _state.data,
          loaded = _state.loaded;

      return _react2.default.createElement(Component, _extends({ data: data, loaded: loaded }, this.props));
    }
  }, {
    key: 'getDataObject',
    get: function get() {
      var _this7 = this;

      return _lodash2.default.reduce(_lodash2.default.filter(_GnewmineStore2.default.subscriptions, function (publication) {
        return _lodash2.default.includes(_this7.subs, publication.publicationNameWithParams);
      }), function (data, dataPart) {
        return _lodash2.default.merge(data, (0, _mobx2.toJS)(dataPart.data));
      }, {});
    }
  }, {
    key: 'getLoaded',
    get: function get() {
      var _this8 = this;

      return _lodash2.default.every(_lodash2.default.filter(_GnewmineStore2.default.subscriptions, function (publication) {
        return _lodash2.default.includes(_this8.subs, publication.publicationNameWithParams);
      }), function (o) {
        return o.loaded === true;
      });
    }
  }]);

  return WithGnewmine;
}(_react2.default.Component), (_applyDecoratedDescriptor(_class.prototype, 'checkSubscriptions', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'checkSubscriptions'), _class.prototype)), _class);
exports.default = withGnewmine;