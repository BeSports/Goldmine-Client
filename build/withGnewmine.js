'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _GnewminePusher = require('./GnewminePusher');

var _GnewminePusher2 = _interopRequireDefault(_GnewminePusher);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

var _deepDiff = require('deep-diff');

var _deepDiff2 = _interopRequireDefault(_deepDiff);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _UserStore = require('../../frontend/src/stores/UserStore');

var _UserStore2 = _interopRequireDefault(_UserStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withGnewmine = function withGnewmine(Component, subscriptions) {
  return function (props) {
    return _react2.default.createElement(
      _GnewminePusher2.default.Consumer,
      null,
      function (socket) {
        return _react2.default.createElement(WithGnewmine, _extends({}, props, {
          socket: socket,
          Component: Component,
          subscriptions: subscriptions
        }));
      }
    );
  };
};

var WithGnewmine = function (_React$Component) {
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

    _this.state = {
      loaded: false,
      data: {}
    };
    return _this;
  }

  _createClass(WithGnewmine, [{
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      this.doGnewMine(nextProps, this.props);
    }
  }, {
    key: 'doGnewMine',
    value: function doGnewMine(props, prevProps) {
      var _this2 = this;

      var toOmit = ['Component', 'socket', 'match', 'location', 'history'];
      if (prevProps && JSON.stringify(_lodash2.default.omit(props, toOmit)) === JSON.stringify(_lodash2.default.omit(prevProps, toOmit))) {
        return;
      }

      var socket = props.socket;

      var headers = {};
      var jwt = localStorage.getItem('jwt');
      if (jwt) {
        headers['x-access-token'] = jwt;
        if (_UserStore2.default.impersonatedJwt) {
          headers['x-impersonate-jwt'] = _UserStore2.default.impersonatedJwt;
        } else if (_UserStore2.default.impersonatedUsername) {
          headers['x-impersonate-name'] = _UserStore2.default.impersonatedUsername;
        }
      }

      var subscriptionsToSend = this.getSubscriptionsToSend(props);

      if (_lodash2.default.size(subscriptionsToSend) === 0) {
        return;
      }

      var options = {
        url: process.env.GNEWMINE_SERVER,
        headers: headers,
        method: 'POST',
        data: {
          subscriptions: subscriptionsToSend
        },
        mode: 'cors'
      };
      (0, _axios2.default)(options).then(function (response) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('GNM init', subscriptionsToSend, response.data);
        }
        _this2.setState({
          data: response.data,
          loaded: true
        });
      });

      var applyUpdate = this.applyUpdate;

      _lodash2.default.map(subscriptionsToSend, function (subscription) {
        var channel = socket.subscribe(_this2.toPusherName(subscription));
        channel.bind('update', function (data) {
          if (process.env.NODE_ENV !== 'production') {
            console.log('GNM update', subscriptionsToSend, data.diff);
          }
          applyUpdate(data.diff);
        });
      });
    }
  }, {
    key: 'componentWillMount',
    value: function componentWillMount() {
      this.doGnewMine(this.props);
    }
  }, {
    key: 'getSubscriptionsToSend',
    value: function getSubscriptionsToSend(props) {
      var _this3 = this;

      var subscriptionsFunction = props.subscriptions;

      var subscriptions = subscriptionsFunction(props);
      var subscriptionsToSend = _lodash2.default.map(subscriptions, function (subscription) {
        return subscription.publication + '?' + _this3.buildParams(subscription.props);
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
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var _this4 = this;

      var socket = this.props.socket;


      _lodash2.default.map(this.getSubscriptionsToSend(this.props), function (subscription) {
        socket.unsubscribe(_this4.toPusherName(subscription));
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
  }]);

  return WithGnewmine;
}(_react2.default.Component);

exports.default = withGnewmine;