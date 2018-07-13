'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactVisibilitySensor = require('react-visibility-sensor');

var _reactVisibilitySensor2 = _interopRequireDefault(_reactVisibilitySensor);

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

var _GnewMine = require('./GnewMine');

var _GnewMine2 = _interopRequireDefault(_GnewMine);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withLoadmore = function withLoadmore(Component, subscriptions, options) {
  var WithLoadmore = function (_React$Component) {
    _inherits(WithLoadmore, _React$Component);

    function WithLoadmore() {
      _classCallCheck(this, WithLoadmore);

      var _this = _possibleConstructorReturn(this, (WithLoadmore.__proto__ || Object.getPrototypeOf(WithLoadmore)).call(this));

      _this.setVisible = _this.setVisible.bind(_this);
      _this.isThereMore = _this.isThereMore.bind(_this);
      _this.triggerIncrement = _this.triggerIncrement.bind(_this);
      _this.state = {
        isMoreAvailable: false,
        allowSensor: false,
        increment: false
      };
      return _this;
    }

    _createClass(WithLoadmore, [{
      key: 'setVisible',
      value: function setVisible(state) {
        if (state) {
          this.setState({
            visible: state,
            allowSensor: !state
          }, this.triggerIncrement);
        }
      }
    }, {
      key: 'isThereMore',
      value: function isThereMore(counters) {
        this.setState({
          isMoreAvailable: _lodash2.default.find(counters, ['hasMore', true]),
          allowSensor: true,
          increment: false
        });
      }
    }, {
      key: 'triggerIncrement',
      value: function triggerIncrement() {
        if (this.state.isMoreAvailable && this.state.visible) {
          this.setState({
            visible: false,
            increment: true
          });
        }
      }
    }, {
      key: 'render',
      value: function render() {
        var containmentId = this.props.containmentId;
        var _state = this.state,
            increment = _state.increment,
            allowSensor = _state.allowSensor,
            isMoreAvailable = _state.isMoreAvailable;
        var scrollUp = options.scrollUp,
            loader = options.loader;

        var sensor = _react2.default.createElement(_reactVisibilitySensor2.default, {
          onChange: this.setVisible,
          partialVisibility: true,
          containment: document.getElementById(containmentId)
        });

        return _react2.default.createElement(
          _react2.default.Fragment,
          null,
          scrollUp && allowSensor && isMoreAvailable && sensor,
          scrollUp && isMoreAvailable && (loader || 'Loading ...'),
          _react2.default.createElement(_GnewMine2.default, _extends({
            gm: true,
            Component: Component,
            subscriptions: subscriptions,
            onLoaded: this.isThereMore,
            trigger: increment
          }, this.props)),
          !scrollUp && isMoreAvailable && (loader || 'Loading ...'),
          !scrollUp && allowSensor && isMoreAvailable && sensor
        );
      }
    }]);

    return WithLoadmore;
  }(_react2.default.Component);

  WithLoadmore.propTypes = {
    containmentId: _propTypes2.default.string,
    scrollUp: _propTypes2.default.bool,
    Loader: _propTypes2.default.func
  };

  return (0, _hoistNonReactStatics2.default)(WithLoadmore, Component);
};

exports.default = withLoadmore;