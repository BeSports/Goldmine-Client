'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _desc, _value, _class;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withGnewmine = function withGnewmine(Component, subscriptions) {
  var WithGnewmineInside = function (_React$Component) {
    _inherits(WithGnewmineInside, _React$Component);

    function WithGnewmineInside() {
      _classCallCheck(this, WithGnewmineInside);

      return _possibleConstructorReturn(this, (WithGnewmineInside.__proto__ || Object.getPrototypeOf(WithGnewmineInside)).apply(this, arguments));
    }

    _createClass(WithGnewmineInside, [{
      key: 'render',
      value: function render() {
        return _react2.default.createElement(WithGnewmine, _extends({
          gm: true,
          Component: Component,
          subscriptions: subscriptions
        }, this.props));
      }
    }]);

    return WithGnewmineInside;
  }(_react2.default.Component);

  return (0, _hoistNonReactStatics2.default)(WithGnewmineInside, Component);
};

var WithGnewmine = (_class = function (_React$Component2) {
  _inherits(WithGnewmine, _React$Component2);

  function WithGnewmine() {
    _classCallCheck(this, WithGnewmine);

    var _this2 = _possibleConstructorReturn(this, (WithGnewmine.__proto__ || Object.getPrototypeOf(WithGnewmine)).call(this));

    _this2.applyUpdate = _this2.applyUpdate.bind(_this2);
    _this2.buildParams = _this2.buildParams.bind(_this2);
    _this2.getSubscriptionsToSend = _this2.getSubscriptionsToSend.bind(_this2);
    _this2.toPusherName = _this2.toPusherName.bind(_this2);
    _this2.extractPublicationName = _this2.extractPublicationName.bind(_this2);
    _this2.doGnewMine = _this2.doGnewMine.bind(_this2);
    _this2.checkSubscriptions = _this2.checkSubscriptions.bind(_this2);
    _this2.cancelSubscriptionsWithoutRecentCheck = _this2.cancelSubscriptionsWithoutRecentCheck.bind(_this2);

    _this2.state = {
      loaded: false,
      data: {}
    };
    _this2.subs = [];
    return _this2;
  }

  _createClass(WithGnewmine, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.doGnewMine(nextProps, this.props);
    }
  }, {
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this3 = this;

      _GnewmineStore2.default.registerWithGnewmine(this);
      this.doAutoRun = function () {
        _this3.doGnewMine(_this3.props, {});
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
      var _this4 = this;

      if (JSON.stringify(nextProps) !== JSON.stringify(prevProps)) {
        // Run changes in transaction.
        // When transaction is complete the necessary updates will take place.
        (0, _mobx.runInAction)(function () {
          _this4.recentChecks = [];
          _this4.nextProps = nextProps;
          var subscriptionsToSend = _this4.getSubscriptionsToSend(nextProps);
          if (_this4.subs !== subscriptionsToSend) {
            _this4.checkSubscriptions(subscriptionsToSend);
            _this4.cancelSubscriptionsWithoutRecentCheck();
          }
          _this4.setState({
            data: _this4.getDataObject,
            loaded: _this4.getLoaded
          });
        });
      }
    }

    // checks all subscriptions for new subscrtiptions

  }, {
    key: 'checkSubscriptions',
    value: function checkSubscriptions(subscriptionsToSend) {
      var _this5 = this;

      _lodash2.default.forEach(subscriptionsToSend, function (publicationNameWithParams) {
        _this5.recentChecks = _lodash2.default.concat(_this5.recentChecks, publicationNameWithParams);
        if (_lodash2.default.includes(_this5.subs, publicationNameWithParams)) {
          // was already subscribed
          return;
        }
        _GnewmineStore2.default.subscribe(publicationNameWithParams);
        _this5.subs.push(publicationNameWithParams);
      });
    }

    // removes all subscriptions which were not needed anymore

  }, {
    key: 'cancelSubscriptionsWithoutRecentCheck',
    value: function cancelSubscriptionsWithoutRecentCheck() {
      var _this6 = this;

      _lodash2.default.forEach(this.subs, function (publicationNameWithParams) {
        if (!_lodash2.default.includes(_this6.recentChecks, publicationNameWithParams)) {
          _GnewmineStore2.default.cancelSubscription(publicationNameWithParams);
          delete _this6.subs[_lodash2.default.indexOf(_this6.subs, publicationNameWithParams)];
        }
      });
      this.recentChecks = [];
    }
  }, {
    key: 'getSubscriptionsToSend',
    value: function getSubscriptionsToSend(props) {
      var _this7 = this;

      var subscriptionsFunction = props.subscriptions;
      var subscriptions = subscriptionsFunction(props);
      var subscriptionsToSend = _lodash2.default.map(subscriptions, function (subscription) {
        return subscription.publication + '?' + _this7.buildParams(_lodash2.default.merge(subscription.private === true ? { userId: _GnewmineStore2.default.userId } : {}, subscription.props));
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
      var _this8 = this;

      return _lodash2.default.reduce(_lodash2.default.filter(_GnewmineStore2.default.subscriptions, function (publication) {
        return _lodash2.default.includes(_this8.subs, publication.publicationNameWithParams);
      }), function (data, dataPart) {
        return _lodash2.default.merge(data, (0, _mobx2.toJS)(dataPart.data));
      }, {});
    }
  }, {
    key: 'getLoaded',
    get: function get() {
      var _this9 = this;

      return _lodash2.default.every(_lodash2.default.filter(_GnewmineStore2.default.subscriptions, function (publication) {
        return _lodash2.default.includes(_this9.subs, publication.publicationNameWithParams);
      }), function (o) {
        return o.loaded === true;
      });
    }
  }]);

  return WithGnewmine;
}(_react2.default.Component), (_applyDecoratedDescriptor(_class.prototype, 'checkSubscriptions', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'checkSubscriptions'), _class.prototype)), _class);
exports.default = withGnewmine;