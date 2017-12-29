import { observable, action, extendObservable, toJS } from 'mobx';
import _ from 'lodash';
import OperationTypes from '../enums/OperationTypes';
import deepDifference from 'deep-diff';
class DataStore {
  @observable collections = {};

  constructor() {
    this.primaryKey = '';
  }

  /**
   * Sets primary key.
   *
   * @param primaryKey
   */
  setPrimaryKey(primaryKey) {
    this.primaryKey = primaryKey;
  }

  /**
   * Checks if a collection exists.
   * If not it will create the collection.
   *
   * @param collectionName
   */
  @action
  createCollectionIfNotExists(collectionName) {
    if (this.collections.hasOwnProperty(collectionName)) {
      return;
    }

    // Create collection.
    let collection = {};
    collection[collectionName] = [];

    extendObservable(this.collections, collection);
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
  @action
  change(response, updateLogs) {
    _.forEach(response.data, main => {
      _.forEach(main.data, document => {
        // Check if document is already in the store.
        const dbObject = _.find(this.collections[main.collectionName], this.paramsFind(document));
        if (dbObject === undefined) {
          this.insertDocument(main.collectionName, document, response, updateLogs);
        } else {
          if (document.removeFromSub) {
            if (_.size(toJS(dbObject['__publicationNameWithParams'])) > 1) {
              dbObject['__publicationNameWithParams'].replace(
                _.filter(toJS(dbObject['__publicationNameWithParams']), pnwp => {
                  return document.removeFromSub !== pnwp;
                }),
              );
            } else {
              this.deleteDocument(dbObject, main.collectionName);
            }
          } else {
            this.updateDocument(response, document, dbObject, updateLogs);
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
  @action
  updateDocument(response, updateDocument, dbObject, updateLogs) {
    if (_.has(updateDocument, 'differences')) {
      _.map(updateDocument.differences, diff => {
        deepDifference.applyChange(dbObject, {}, diff);
      });
      if (updateLogs) {
        console.log(toJS(dbObject));
      }
    } else {
      const __publicationNameWithParams = _.concat(
        toJS(dbObject['__publicationNameWithParams']),
        updateDocument['__publicationNameWithParams'],
      );
      extendObservable(dbObject, updateDocument, { __publicationNameWithParams });
    }
  }

  /**
   * Inserts a new document in a collection.
   *
   * @param publicationNameWithParams
   * @param collectionName
   * @param data
   */
  @action
  insertDocument(collectionName, data, response, updateLogs) {
    this.createCollectionIfNotExists(collectionName);
    if (!this.documentExists(collectionName, data)) {
      this.collections[collectionName].push(data);
    } else {
      this.updateDocument(
        collectionName,
        response,
        data,
        _.find(this.collections[collectionName], this.paramsFind(data)),
        updateLogs,
      );
    }
  }

  /**
   * Checks if document exists.
   *
   * @param collectionName
   * @param data
   * @returns {boolean}
   */
  documentExists(collectionName, data) {
    const document = _.find(this.collections[collectionName], this.paramsFind(data));
    return document !== undefined;
  }

  /**
   * Deletes a document from a collection.
   *
   * @param response
   */
  @action
  deleteDocument(tempObj, collectionName) {
    this.collections[collectionName].remove(tempObj);
  }

  /**
   * Remove all objects belonging to a subscription.
   *
   * @param publicationNameWithParams
   */
  @action
  garbageCollector(publicationNameWithParams) {
    _.map(this.collections, (collection, i) => {
      _.remove(collection, o => {
        return o['__publicationNameWithParams'] === observable([publicationNameWithParams]);
      });
      let toReturn = _.filter(
        _.map(collection, o => {
          if (_.includes(o['__publicationNameWithParams'], publicationNameWithParams)) {
            let oCopy = o;
            oCopy['__publicationNameWithParams'] = _.filter(
              o['__publicationNameWithParams'],
              obj => {
                return obj !== publicationNameWithParams;
              },
            );
            if (_.size(oCopy['__publicationNameWithParams']) === 0) {
              return null;
            }
            return oCopy;
          }
          return o;
        }),
        o => {
          return o !== null;
        },
      );
      this.collections[i] = toReturn;
    });
  }

  /**
   * Builds an object that can be used to search for
   * a document using lodash.
   *
   * @param data
   * @returns {{}}
   */
  paramsFind(data) {
    const paramsFind = {};
    if (data[this.primaryKey]) {
      paramsFind[this.primaryKey] = data[this.primaryKey];
    } else {
      paramsFind['rid'] = data['rid'];
    }
    return paramsFind;
  }
}

export default new DataStore();
