'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createContainer = require('./createContainer');

var _createContainer2 = _interopRequireDefault(_createContainer);

var _propTypes = require('prop-types');

var _propTypes2 = _interopRequireDefault(_propTypes);

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var GoldMine = (0, _createContainer2.default)(function (component, props) {
  _lodash2.default.map(props.subscriptions, function (sub) {
    return component.subscribe(sub.name, sub.props, sub.isReactive);
  });
  return {};
}, undefined);

GoldMine.propTypes = {
  subscriptions: _propTypes2.default.arrayOf(_propTypes2.default.shape({
    name: _propTypes2.default.string.isRequired,
    props: _propTypes2.default.object,
    isReactive: _propTypes2.default.bool
  }))
};
exports.default = GoldMine;