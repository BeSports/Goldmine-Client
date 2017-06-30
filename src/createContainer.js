import React from 'react';
import { autorun, runInAction } from 'mobx';
import _ from 'lodash';

import pubSubStore from './stores/PubSubStore';
import dataStore from './stores/DataStore';

/**
 * Sub container:
 *
 * Can dispatch actions to the stores.
 *
 * @param requests
 * @param Component
 * @returns {*}
 */
export default (requests, Component) => {
  return class SubContainer extends React.Component {
    constructor(props) {
      super(props);

      this.subs = {};
      this.garbageCollectorRunning = false;
      this.dataProps = props;
      this.loaders = 0;
    }

    componentWillMount() {
      this.setState({ loaders: this.loaders });

      this.handler = autorun(() => {
        if (!this.garbageCollectorRunning) {
          if (_.size(this.subs) !== 0 && this.loaders > 0) {
            this.loaders--;
          }

          this.getData(this.dataProps);
        }
      });
    }

    componentWillReceiveProps(nextProps) {
      if (JSON.stringify(nextProps.match) !== JSON.stringify(this.props.match)) {
        // Run changes in transaction.
        // When transaction is complete te necessary updates will take place.
        runInAction(() => {
          let copySubs = Object.assign({}, this.subs);

          this.dataProps = nextProps;

          this.cancelSubscriptions();
          this.getData(nextProps);
          this.garbageCollector(copySubs);
        });
      } else if (JSON.stringify(nextProps.options) !== JSON.stringify(this.props.options)) {
        runInAction(() => {
          this.getData(nextProps);
        });
      }
    }

    componentWillUnmount() {
      let copySubs = Object.assign({}, this.subs);

      this.cancelSubscriptions();
      this.handler();
      this.garbageCollector(copySubs);
    }

    render() {
      return <Component {...this.state} options={this.props.options} {...this.props} />;
    }

    /**
     * Reactive method. This method will be called whenever
     * relevant changes happen in the store.
     */
    getData(props) {
      let temp = requests(this, props);
      temp['loaders'] = this.loaders;

      this.setState(temp);
    }

    // TODO: Gets called twice when changing params
    subscribe(publicationName, params, isReactive, options) {
      const publicationNameWithParams = publicationName + '?' + this.buildParams(params);

      if (this.subs.hasOwnProperty(publicationNameWithParams)) {
        return;
      }

      // Notify store
      pubSubStore.subscribe(publicationNameWithParams, isReactive, options);

      // Sub container tracks his subs
      this.subs[publicationNameWithParams] = isReactive;

      // Increment loaders
      this.loaders++;
    }

    /**
     * Convert params object to string for subscription name.
     *
     * @param params
     * @returns {string}
     */
    buildParams(params) {
      let buildParams = '';
      let x = 0;

      const size = Object.keys(params).length - 1;

      _.forEach(params, (value, key) => {
        const tempValue = JSON.stringify(value);
        buildParams += `${key}=${tempValue}`;

        if (x < size) {
          buildParams += '&';
        }

        x++;
      });

      return buildParams;
    }

    /**
     * Cancels all subscriptions for the sub container.
     */
    cancelSubscriptions() {
      _.forEach(this.subs, (isReactive, publicationNameWithParams) => {
        pubSubStore.cancelSubscription(publicationNameWithParams);
        delete this.subs[publicationNameWithParams];
      });
    }

    /**
     * Returns the MobX data store.
     *
     * @returns {DataStore}
     */
    getDataStore() {
      return dataStore;
    }

    /**
     * Returns a specific collection from the data store.
     *
     * @param collectionName
     */
    getCollection(collectionName) {
      this.getDataStore().createCollectionIfNotExists(collectionName);

      return this.getDataStore().collections[collectionName];
    }

    /**
     * Cleans the data store for a given publication.
     *
     * @param subs
     */
    garbageCollector(subs) {
      _.forEach(subs, (isReactive, publicationNameWithParams) => {
        dataStore.garbageCollector(publicationNameWithParams);
      });
    }
  };
};
