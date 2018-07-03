'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _GnewmineStore = require('./stores/GnewmineStore');

var _GnewmineStore2 = _interopRequireDefault(_GnewmineStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GnewmineContainer = function (_React$Component) {
  _inherits(GnewmineContainer, _React$Component);

  function GnewmineContainer() {
    _classCallCheck(this, GnewmineContainer);

    return _possibleConstructorReturn(this, (GnewmineContainer.__proto__ || Object.getPrototypeOf(GnewmineContainer)).apply(this, arguments));
  }

  _createClass(GnewmineContainer, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      _GnewmineStore2.default.setSocket(this.props.socket);
      _GnewmineStore2.default.setHeaders(this.props.headers);
      _GnewmineStore2.default.setUserId(this.props.userId);
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      _GnewmineStore2.default.setSocket(nextProps.socket);
      _GnewmineStore2.default.setHeaders(nextProps.headers);
      _GnewmineStore2.default.setUserId(nextProps.userId);
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.children || null;
    }
  }]);

  return GnewmineContainer;
}(_react2.default.Component);

exports.default = GnewmineContainer;


GnewmineContainer.propTypes = {
  socket: _propTypes2.default.object,
  headers: _propTypes2.default.object,
  userId: _propTypes2.default.string,
  children: _propTypes2.default.node
};