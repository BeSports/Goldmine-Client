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

var _extractPublicationName = require('../../gnewmine/src/helpers/extractPublicationName');

var _extractPublicationName2 = _interopRequireDefault(_extractPublicationName);

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

    _this.toPusherName = function (subscriptionName) {
      var publicationName = (0, _extractPublicationName2.default)(subscriptionName);
      var key = subscriptionName.indexOf('?');
      var params = subscriptionName.substring(key + 1);
      var encodedParamsString = _base2.default.encode(params);
      var pusherName = publicationName + '_' + encodedParamsString;
      return pusherName;
    };

    _this.applyUpdate = _this.applyUpdate.bind(_this);
    _this.buildParams = _this.buildParams.bind(_this);
    _this.toPusherName = _this.toPusherName.bind(_this);
    _this.state = {
      loaded: false,
      data: {}
    };
    return _this;
  }

  _createClass(WithGnewmine, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this2 = this;

      var socket = this.props.socket;

      var subscriptionsFunction = this.props.subscriptions;
      var headers = {};
      var jwt = localStorage.getItem('jwt');
      if (jwt) {
        headers['x-access-token'] = jwt;
      }

      var subscriptions = subscriptionsFunction(this.props);
      var subscriptionsToSend = _lodash2.default.map(subscriptions, function (subscription) {
        return subscription.publication + '?' + _this2.buildParams(subscription.props);
      });

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
        _this2.setState({
          data: response.data,
          loaded: true
        });
      });

      var applyUpdate = this.applyUpdate;

      _lodash2.default.map(subscriptionsToSend, function (subscription) {
        var channel = socket.subscribe(_this2.toPusherName(subscription));
        channel.bind('update', function (data) {
          applyUpdate(data.diff);
        });
      });
    }
  }, {
    key: 'buildParams',


    /**
     * Convert params object to string for subscription name.
     *
     * @param params
     * @returns {string}
     */
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
      var socket = this.props.socket;


      socket.unsubscribe('storyForId');
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