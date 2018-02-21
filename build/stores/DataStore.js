'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _desc, _value, _class, _descriptor;

var _mobx = require('mobx');

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _OperationTypes = require('../enums/OperationTypes');

var _OperationTypes2 = _interopRequireDefault(_OperationTypes);

var _deepDiff = require('deep-diff');

var _deepDiff2 = _interopRequireDefault(_deepDiff);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _initDefineProp(target, property, descriptor, context) {
  if (!descriptor) return;
  Object.defineProperty(target, property, {
    enumerable: descriptor.enumerable,
    configurable: descriptor.configurable,
    writable: descriptor.writable,
    value: descriptor.initializer ? descriptor.initializer.call(context) : void 0
  });
}

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

function _initializerWarningHelper(descriptor, context) {
  throw new Error('Decorating class property failed. Please ensure that transform-class-properties is enabled.');
}

var DataStore = (_class = function () {
  function DataStore() {
    _classCallCheck(this, DataStore);

    _initDefineProp(this, 'collections', _descriptor, this);

    this.primaryKey = '';
  }

  /**
   * Sets primary key.
   *
   * @param primaryKey
   */


  _createClass(DataStore, [{
    key: 'setPrimaryKey',
    value: function setPrimaryKey(primaryKey) {
      this.primaryKey = primaryKey;
    }

    /**
     * Checks if a collection exists.
     * If not it will create the collection.
     *
     * @param collectionName
     */

  }, {
    key: 'createCollectionIfNotExists',
    value: function createCollectionIfNotExists(collectionName) {
      if (this.collections.hasOwnProperty(collectionName)) {
        return;
      }

      // Create collection.
      var collection = {};
      collection[collectionName] = [];

      (0, _mobx.extendObservable)(this.collections, collection);
    }

    /**
     * Only the data in de store with the propKey
     * will be updated. All the other data in the store
     * will be kept untouched.
     *
     * @param publicationNameWithParams
     * @param response
     * @param options
     */

  }, {
    key: 'change',
    value: function change(response, updateLogs) {
      var _this = this;

      _lodash2.default.forEach(response.data, function (main) {
        _lodash2.default.forEach(main.data, function (document) {
          // Check if document is already in the store.
          var dbObject = _lodash2.default.find(_this.collections[main.collectionName], _this.paramsFind(document));
          if (dbObject === undefined) {
            _this.insertDocument(main.collectionName, document, response, updateLogs);
          } else {
            if (document.removeFromSub) {
              if (_lodash2.default.size((0, _mobx.toJS)(dbObject['__publicationNameWithParams'])) > 1) {
                dbObject['__publicationNameWithParams'].replace(_lodash2.default.filter((0, _mobx.toJS)(dbObject['__publicationNameWithParams']), function (pnwp) {
                  return document.removeFromSub !== pnwp;
                }));
              } else {
                _this.deleteDocument(dbObject, main.collectionName);
              }
            } else {
              _this.updateDocument(response, document, dbObject, updateLogs);
            }
          }
        });
      });
      // else if (response.type === OperationTypes.DELETE) {
      //   this.deleteDocument(response);
      // }
    }

    /**
     * Updates document in a collection.
     *
     * @param collectionName
     * @param response
     * @param data
     * @param dbObject
     */

  }, {
    key: 'updateDocument',
    value: function updateDocument(response, _updateDocument, dbObject, updateLogs) {
      if (_lodash2.default.has(_updateDocument, 'differences')) {
        _lodash2.default.map(_updateDocument.differences, function (diff) {
          _deepDiff2.default.applyChange(dbObject, {}, diff);
        });
        if (updateLogs) {
          console.log((0, _mobx.toJS)(dbObject));
        }
      } else {
        var __publicationNameWithParams = _lodash2.default.concat((0, _mobx.toJS)(dbObject['__publicationNameWithParams']), _updateDocument['__publicationNameWithParams']);
        (0, _mobx.extendObservable)(dbObject, _lodash2.default.merge((0, _mobx.toJS)(dbObject), _updateDocument), {
          __publicationNameWithParams: __publicationNameWithParams
        });
      }
    }

    /**
     * Inserts a new document in a collection.
     *
     * @param publicationNameWithParams
     * @param collectionName
     * @param data
     */

  }, {
    key: 'insertDocument',
    value: function insertDocument(collectionName, data, response, updateLogs) {
      this.createCollectionIfNotExists(collectionName);
      if (!this.documentExists(collectionName, data)) {
        this.collections[collectionName].push(data);
      } else {
        this.updateDocument(collectionName, response, data, _lodash2.default.find(this.collections[collectionName], this.paramsFind(data)), updateLogs);
      }
    }

    /**
     * Checks if document exists.
     *
     * @param collectionName
     * @param data
     * @returns {boolean}
     */

  }, {
    key: 'documentExists',
    value: function documentExists(collectionName, data) {
      var document = _lodash2.default.find(this.collections[collectionName], this.paramsFind(data));
      return document !== undefined;
    }

    /**
     * Deletes a document from a collection.
     *
     * @param response
     */

  }, {
    key: 'deleteDocument',
    value: function deleteDocument(tempObj, collectionName) {
      this.collections[collectionName].remove(tempObj);
    }

    /**
     * Remove all objects belonging to a subscription.
     *
     * @param publicationNameWithParams
     */

  }, {
    key: 'garbageCollector',
    value: function garbageCollector(publicationNameWithParams) {
      var _this2 = this;

      _lodash2.default.map(this.collections, function (collection, i) {
        _lodash2.default.remove(collection, function (o) {
          return o['__publicationNameWithParams'] === (0, _mobx.observable)([publicationNameWithParams]);
        });
        var toReturn = _lodash2.default.filter(_lodash2.default.map(collection, function (o) {
          if (_lodash2.default.includes(o['__publicationNameWithParams'], publicationNameWithParams)) {
            var oCopy = o;
            oCopy['__publicationNameWithParams'] = _lodash2.default.filter(o['__publicationNameWithParams'], function (obj) {
              return obj !== publicationNameWithParams;
            });
            if (_lodash2.default.size(oCopy['__publicationNameWithParams']) === 0) {
              return null;
            }
            return oCopy;
          }
          return o;
        }), function (o) {
          return o !== null;
        });
        _this2.collections[i] = toReturn;
      });
    }

    /**
     * Builds an object that can be used to search for
     * a document using lodash.
     *
     * @param data
     * @returns {{}}
     */

  }, {
    key: 'paramsFind',
    value: function paramsFind(data) {
      var paramsFind = {};
      if (data[this.primaryKey]) {
        paramsFind[this.primaryKey] = data[this.primaryKey];
      } else {
        paramsFind['rid'] = data['rid'];
      }
      return paramsFind;
    }
  }]);

  return DataStore;
}(), (_descriptor = _applyDecoratedDescriptor(_class.prototype, 'collections', [_mobx.observable], {
  enumerable: true,
  initializer: function initializer() {
    return {};
  }
}), _applyDecoratedDescriptor(_class.prototype, 'createCollectionIfNotExists', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'createCollectionIfNotExists'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'change', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'change'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'updateDocument', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'updateDocument'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'insertDocument', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'insertDocument'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'deleteDocument', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'deleteDocument'), _class.prototype), _applyDecoratedDescriptor(_class.prototype, 'garbageCollector', [_mobx.action], Object.getOwnPropertyDescriptor(_class.prototype, 'garbageCollector'), _class.prototype)), _class);
exports.default = new DataStore();