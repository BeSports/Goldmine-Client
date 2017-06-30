import { observable, action, extendObservable } from 'mobx';
import _ from 'lodash';
import OperationTypes from '../enums/OperationTypes';

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
  change(publicationNameWithParams, response, options) {
    if (response.type === OperationTypes.INIT) {
      _.forEach(response.data, main => {
        _.forEach(main.data, document => {
          // Check if document is already in the store.
          const dbObject = _.find(this.collections[main.collectionName], this.paramsFind(document));

          if (dbObject === undefined) {
            this.insertDocument(publicationNameWithParams, main.collectionName, document, options);
          } else {
            this.updateDocument(main.collectionName, response, document, dbObject);
          }
        });
      });
    } else if (response.type === OperationTypes.UPDATE) {
      this.updateDocument(response.collectionName, response, response.data);
    } else if (response.type === OperationTypes.INSERT) {
      this.insertDocument(
        publicationNameWithParams,
        response.collectionName,
        response.data,
        options,
      );
    } else if (response.type === OperationTypes.DELETE) {
      this.deleteDocument(response);
    }
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
  updateDocument(collectionName, response, data, dbObject) {
    // Check if dbObject is given along with the method call.
    if (dbObject === undefined) {
      if (response.target !== undefined) {
        dbObject = _.filter(this.collections[collectionName], obj => {
          if (obj[response.target] instanceof Array) {
            return _.find(obj[response.target], this.paramsFind(data)) ? true : false;
          } else {
            return obj[response.target][this.primaryKey] === data[this.primaryKey];
          }
        });
      } else {
        dbObject = _.find(this.collections[collectionName], this.paramsFind(data));
      }

      // Check if dbObject is still undefined.
      if (dbObject === undefined) {
        return;
      }
    }

    let temp = {};

    // Update properties or add new ones.
    _.forEach(data, (value, key) => {
      if (dbObject instanceof Array) {
        _.forEach(dbObject, obj => {
          if (obj[response.target].hasOwnProperty(key)) {
            obj[response.target][key] = value;
          } else {
            temp[key] = value;
          }

          // Make new properties observable.
          if (obj[response.target] instanceof Array) {
            let embeddedObject = _.find(obj[response.target], this.paramsFind(data));
            extendObservable(embeddedObject, temp); // TODO: check placement
          }
        });
      } else {
        if (dbObject.hasOwnProperty(key)) {
          dbObject[key] = value;
        } else {
          temp[key] = value;
        }
      }
    });

    // TODO
    if (!(dbObject instanceof Array)) {
      // Make new properties observable.
      extendObservable(dbObject, temp);
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
  insertDocument(publicationNameWithParams, collectionName, data, options) {
    data['__publicationNameWithParams'] = publicationNameWithParams;

    if (!this.documentExists(collectionName, data)) {
      // If limit is defined in options, first delete an item.
      if (options !== undefined && options.limit !== undefined && options.sortBy !== undefined) {
        const collection = _.filter(this.collections[collectionName], {
          __publicationNameWithParams: publicationNameWithParams,
        });

        let tempSorted = collection.sort((a, b) => {
          return b[options.sortBy].localeCompare(a[options.sortBy]);
        });

        if (collection.length >= options.limit) {
          this.collections[collectionName].remove(
            tempSorted[this.collections[collectionName].length - 1],
          );
        }
      }

      this.collections[collectionName].push(data);
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

    // TODO: volledig document verwijderen wanneer enkel extend wordt verwijderd?
    if (response.target === undefined) {
      tempObj = _.find(this.collections[response.collectionName], paramsFind(response.data));
    } else {
      tempObj = _.find(this.collections[response.collectionName], obj => {
        return obj[response.target][this.primaryKey] === response.data[this.primaryKey];
      });
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
    _.forEach(this.collections, collection => {
      _.remove(collection, { __publicationNameWithParams: publicationNameWithParams });
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
    paramsFind[this.primaryKey] = data[this.primaryKey];

    return paramsFind;
  }
}

export default new DataStore();
