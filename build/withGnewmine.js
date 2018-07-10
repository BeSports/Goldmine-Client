'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _hoistNonReactStatics = require('hoist-non-react-statics');

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

var _GnewMine = require('./GnewMine');

var _GnewMine2 = _interopRequireDefault(_GnewMine);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var _hoistNonReactStatics2 = _interopRequireDefault(_hoistNonReactStatics);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var withGnewmine = function withGnewmine(Component, subscriptions) {
  var WithGnewmine = function (_React$Component) {
    _inherits(WithGnewmine, _React$Component);

    function WithGnewmine() {
      _classCallCheck(this, WithGnewmine);

      return _possibleConstructorReturn(this, (WithGnewmine.__proto__ || Object.getPrototypeOf(WithGnewmine)).apply(this, arguments));
    }

    _createClass(WithGnewmine, [{
      key: 'render',
      value: function render() {
        return _react2.default.createElement(_GnewMine2.default, _extends({ gm: true, Component: Component, subscriptions: subscriptions }, this.props));
      }
    }]);

    return WithGnewmine;
  }(_react2.default.Component);

  return (0, _hoistNonReactStatics2.default)(WithGnewmine, Component);
};

exports.default = withGnewmine;