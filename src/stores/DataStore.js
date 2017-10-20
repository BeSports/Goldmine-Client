import { observable, action, extendObservable, toJS } from 'mobx';
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
      //TODO: check if obsolete
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
      if(key === '__publicationNameWithParams') {
        dbObject['__publicationNameWithParams'].push(data['__publicationNameWithParams'][0]);
        return;
      }
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
    this.createCollectionIfNotExists(collectionName);
    if (!this.documentExists(collectionName, data)) {
      // If limit is defined in options, first delete an item.
      if (options !== undefined && options.limit !== undefined && options.sortBy !== undefined) {
        const collection = _.filter(this.collections[collectionName], ob => {
          return _.contains(ob.__publicationNameWithParams, publicationNameWithParams);
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
      let toReturn =  _.filter(_.map(collection, o => {
        if(_.includes(o['__publicationNameWithParams'], publicationNameWithParams)) {
          let oCopy = o;
          oCopy['__publicationNameWithParams'] = _.remove(o['__publicationNameWithParams'], publicationNameWithParams);
          if(_.size(oCopy['__publicationNameWithParams']) === 0) {
            return null;
          }
          return oCopy;
        };
        return o;
      }), o => {
        return o !== null;
      });
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
