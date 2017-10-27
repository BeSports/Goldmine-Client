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
          this.updateDocument(response, document, dbObject, updateLogs);
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
  updateDocument(response, updateDocuement, dbObject, updateLogs) {
    if (_.has(updateDocuement, 'differences')) {
      _.map(updateDocuement.differences, diff => {
        deepDifference.applyChange(dbObject, {}, diff);
      });
      if(updateLogs) {
        console.log(toJS(dbObject));
      }
    } else {
      const __publicationNameWithParams = _.concat(
        dbObject['__publicationNameWithParams'],
        updateDocuement['__publicationNameWithParams'],
      );
      extendObservable(dbObject, updateDocuement, { __publicationNameWithParams });
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
        updateLogs
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
  deleteDocument(response) {
    let tempObj = undefined;

    if (response.target === undefined) {
      tempObj = _.find(this.collections[response.collectionName], ['_id', response.data._id]);
    }

    if (tempObj === undefined) {
      throw new Error("Could not delete document, because it's not in the store.");
    }

    this.collections[response.collectionName].remove(tempObj);
  }

  /**
   * Remove all objects belonging to a subscription.
   *
   * @param publicationNameWithParams
   */
  @action
  garbageCollector(publicationNameWithParams) {
    // TODO: array van maken voor meerdere subscriptions te koppelen en bij de laatste pas verwijderen.
    _.map(this.collections, (collection, i) => {
      _.remove(collection, o => {
        return o['__publicationNameWithParams'] === observable([publicationNameWithParams]);
      });
      let toReturn = _.filter(
        _.map(collection, o => {
          if (_.includes(o['__publicationNameWithParams'], publicationNameWithParams)) {
            let oCopy = o;
            oCopy['__publicationNameWithParams'] = _.remove(
              o['__publicationNameWithParams'],
              publicationNameWithParams,
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
      paramsFind['@rid'] = data['@rid'];
    }
    return paramsFind;
  }
}

export default new DataStore();
