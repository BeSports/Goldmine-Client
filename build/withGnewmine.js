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

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

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


      _axios2.default.post(process.env.GNEWMINE_SERVER, { publication: 'storyForId' }).then(function (response) {
        _this2.setState({
          data: response.data,
          loaded: true
        });
      });

      var applyUpdate = this.applyUpdate;

      var channel = socket.subscribe('storyForId');
      channel.bind('anEvent', function (data) {
        applyUpdate(data.diff);
      });
    }
  }, {
    key: 'applyUpdate',
    value: function applyUpdate(differences) {
      var newData = _.cloneDeep(this.state.data);
      _.each(differences, function (singleDiff) {
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


      return _react2.default.createElement(Component, { data: data, loaded: loaded });
    }
  }]);

  return WithGnewmine;
}(_react2.default.Component);

exports.default = withGnewmine;