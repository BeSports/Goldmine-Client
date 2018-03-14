'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _mobx = require('mobx');

var _socket = require('socket.io-client');

var _socket2 = _interopRequireDefault(_socket);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _Config = require('./Config');

var _Config2 = _interopRequireDefault(_Config);

var _PubSubStore = require('./stores/PubSubStore');

var _PubSubStore2 = _interopRequireDefault(_PubSubStore);

var _DataStore = require('./stores/DataStore');

var _DataStore2 = _interopRequireDefault(_DataStore);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Main container is responsible for fetching data
 * and managing subscriptions. Which will be reported to the store.
 */

var MainContainer = function (_React$Component) {
  _inherits(MainContainer, _React$Component);

  function MainContainer(props) {
    _classCallCheck(this, MainContainer);

    var _this = _possibleConstructorReturn(this, (MainContainer.__proto__ || Object.getPrototypeOf(MainContainer)).call(this, props));

    _this.subs = {};
    _this.socket = (0, _socket2.default)(props.host, {
      transports: ['websocket', 'polling'],
      query: props.auth
    });
    _this.state = {
      updateLogs: props.updateLogs,
      initLogs: props.initLogs
    };
    if (props.driver) {
      _DataStore2.default.setPrimaryKey(_Config2.default.drivers[props.driver]);
    } else {
      console.log('GOLDMINE NoDriver provided: Please provide a driver to the maincontainer.');
      throw new Error('Please provide a driver to the maincontainer', 'GOLDMINE No-driver');
    }
    return _this;
  }

  _createClass(MainContainer, [{
    key: 'componentWillMount',
    value: function componentWillMount() {
      var _this2 = this;

      this.startSocket();
      (0, _mobx.autorun)(function () {
        _this2.handleSubscriptions(_PubSubStore2.default.subs);
      });
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.socket.close();
    }
  }, {
    key: 'startSocket',
    value: function startSocket() {
      var _this3 = this;

      if (this.props.auth) {
        this.socket.on('connect', function () {
          if (typeof _this3.props.onConnect === 'function') {
            _this3.props.onConnect('server', 'Connected');
          }
        });
        if (this.props.socket && _lodash2.default.isFunction(this.props.socket)) {
          this.props.socket(this.socket);
        }
        this.socket.on('disconnect', function (t) {
          if (typeof _this3.props.onDisconnect === 'function') {
            if (t === 'io server disconnect') {
              _this3.props.onDisconnect('server', 'Wrong jwt');
            } else if (t === 'transport close') {
              _this3.props.onDisconnect('server', 'Goldmine-server went down');
            } else {
              _this3.props.onDisconnect(_lodash2.default.includes(t, 'client') ? 'client' : 'server', _lodash2.default.includes(t, 'client') ? 'A client side disconnect' : 'A server side disconnect');
            }
          }
        });
        this.socket.on('connect_error', function (t) {
          _this3.props.onDisconnect('client', 'No connection was established to the server');
        });
        this.socket.on('connect_timeout', function (t) {
          _this3.props.onDisconnect('client', 'Connection to the server timed out');
        });
      }
    }
  }, {
    key: 'componentWillReceiveProps',
    value: function componentWillReceiveProps(nextProps) {
      if (JSON.stringify(nextProps) !== JSON.stringify(this.props)) {
        _PubSubStore2.default.subs.clear();
        this.socket.close();
        this.socket = (0, _socket2.default)(nextProps.host);
        this.startSocket();
      }
    }
  }, {
    key: 'render',
    value: function render() {
      return null;
    }

    /**
     * Adds or removes subscriptions.
     *
     * @param newSubs
     */

  }, {
    key: 'handleSubscriptions',
    value: function handleSubscriptions(newSubs) {
      var _this4 = this;

      // Add new subs
      _lodash2.default.forEach(newSubs, function (obj) {
        if (!_this4.subs.hasOwnProperty(obj.publicationNameWithParams)) {
          var listener = function listener(payload) {
            if (_this4.state.initLogs) {
              console.log(payload);
            }
            _DataStore2.default.change(payload, _this4.state.updateLogs);
            _PubSubStore2.default.subs = _lodash2.default.map(_PubSubStore2.default.subs, function (subscription) {
              // set the loaders of the correct subscritpion to 0
              if (subscription.publicationNameWithParams === obj.publicationNameWithParams && payload.type === 'init') {
                var clone = _lodash2.default.cloneDeep(subscription);
                clone.loaders = 0;
                return clone;
              }
              return subscription;
            });
            // rerender the containers whom are subscribing to the publication
            _lodash2.default.map(_PubSubStore2.default.subContainers, function (sc) {
              if (sc && sc.subs && _lodash2.default.includes(_lodash2.default.keys((0, _mobx.toJS)(sc.subs)), obj.publicationNameWithParams)) {
                sc.doAutoRun();
              }
            });
          };

          _this4.subs[obj.publicationNameWithParams] = listener;

          _this4.socket.on(obj.publicationNameWithParams, listener);
          _this4.socket.emit('subscribe', {
            publicationNameWithParams: obj.publicationNameWithParams,
            isReactive: obj.isReactive
          });
        }
      });

      // Remove subs
      _lodash2.default.forEach(this.subs, function (value, key) {
        var exists = _lodash2.default.find(newSubs, function (obj) {
          return obj.publicationNameWithParams === key;
        });

        if (exists === undefined) {
          _this4.socket.emit('unsubscribe', { publicationNameWithParams: key });
          _this4.socket.removeListener(key, value);

          delete _this4.subs[key];
        }
      });
    }
  }]);

  return MainContainer;
}(_react2.default.Component);

exports.default = MainContainer;