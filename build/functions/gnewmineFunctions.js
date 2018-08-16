'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _GnewmineStore = require('../stores/GnewmineStore');

var _GnewmineStore2 = _interopRequireDefault(_GnewmineStore);

var _base = require('base-64');

var _base2 = _interopRequireDefault(_base);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

var gnewmineFunctions = {
  getAllSubscriptions: function getAllSubscriptions() {
    var allSubscriptionNames = _lodash2.default.map(_GnewmineStore2.default.subscriptions, 'publicationNameWithParams');
    return allSubscriptionNames;
  },
  sendSubscriptionReport: function sendSubscriptionReport(username) {
    var _this = this;

    return _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
      var socket, pusherChannels, gnewmineSubscriptions, attachments, chunckedAttachments, url;
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              socket = _GnewmineStore2.default.socket;
              pusherChannels = _lodash2.default.orderBy(socket.channels.channels, ['name']);
              gnewmineSubscriptions = _lodash2.default.orderBy(gnewmineFunctions.getAllSubscriptions());
              attachments = [];

              // make attachment of every pusherChannel

              _lodash2.default.forEach(pusherChannels, function (channel) {
                var decoded = '';

                var _$split = _lodash2.default.split(channel.name, '_'),
                    _$split2 = _slicedToArray(_$split, 2),
                    name = _$split2[0],
                    params = _$split2[1];

                decoded = _base2.default.decode(params);
                attachments.push({
                  title: name + '?' + decoded,
                  fields: [{
                    key: 'Pusher',
                    value: '\u2705 Pusher (subscribed: ' + channel.subscribed + ')',
                    short: true
                  }, {
                    key: 'Gnewmine-Client',
                    value: '🚫 Gnewmine-Client',
                    short: true
                  }],
                  color: '#ce2b2b'
                });
              });

              // iterate over gnewmineSubs
              _lodash2.default.forEach(gnewmineSubscriptions, function (sub) {
                var attachment = _lodash2.default.findIndex(attachments, ['title', sub]);
                if (attachment >= 0) {
                  var gnewmineClientField = _lodash2.default.findIndex(attachments[attachment].fields, ['key', 'Gnewmine-Client']);
                  attachments[attachment].fields[gnewmineClientField].value = '✅ Gnewmine-Client';
                  delete attachments[attachment].color;
                } else {
                  attachments.push({
                    title: sub,
                    fields: [{
                      key: 'Pusher',
                      value: '🚫 Pusher',
                      short: true
                    }, {
                      key: 'Gnewmine-Client',
                      value: '✅ Gnewmine-Client',
                      short: true
                    }],
                    color: '#ce2b2b'
                  });
                }
              });

              // slack only allows 100 attachments per message
              chunckedAttachments = _lodash2.default.chunk(attachments, 100);
              url = 'https://hooks.slack.com/services/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';


              _lodash2.default.forEach(chunckedAttachments, function () {
                var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(chunk, i) {
                  var options;
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          _context.prev = 0;
                          options = {
                            method: 'POST',
                            headers: {
                              'Content-type': 'application/x-www-form-urlencoded'
                            },
                            url: url,
                            json: true,
                            data: {
                              username: 'SubscriptionReportBot',
                              icon_emoji: ':male-detective:',
                              text: i === 0 ? '*' + (username || 'Someone') + '* sent a subscription report' : undefined,
                              attachments: chunk
                            }
                          };
                          _context.next = 4;
                          return (0, _axios2.default)(options);

                        case 4:
                          _context.next = 9;
                          break;

                        case 6:
                          _context.prev = 6;
                          _context.t0 = _context['catch'](0);

                          console.error('Failed to send slack message', _context.t0.response);

                        case 9:
                        case 'end':
                          return _context.stop();
                      }
                    }
                  }, _callee, _this, [[0, 6]]);
                }));

                return function (_x, _x2) {
                  return _ref.apply(this, arguments);
                };
              }());

            case 9:
            case 'end':
              return _context2.stop();
          }
        }
      }, _callee2, _this);
    }))();
  }
};

exports.default = gnewmineFunctions;