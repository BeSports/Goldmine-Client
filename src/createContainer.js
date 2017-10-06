import React from 'react';
import { autorun, runInAction, computed, observable, action } from 'mobx';
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
  return class SubContainer extends React.PureComponent {
    constructor(props) {
      super(props);

      this.subs = {};
      this.garbageCollectorRunning = false;
      this.dataProps = props;
      this.loaders = 0;
    }

    componentWillMount() {
      this.setState({
          loaders: this.loaders
      });
      pubSubStore.registerSubContainer(this);
      this.doAutoRun = () => {
        if (!this.garbageCollectorRunning) {
          let temp = requests(this, this.dataProps);
          temp['loaders'] = this.getLoadersFromSubscriptions;
          this.setState(temp);
        }
      };
      this.doAutoRun();
    }

    componentWillReceiveProps(nextProps) {
      if (JSON.stringify(nextProps) !== JSON.stringify(this.props)) {
        // Run changes in transaction.
        // When transaction is complete the necessary updates will take place.
        runInAction(() => {
          let temp = requests(this, this.dataProps);
          temp['loaders'] = this.getLoadersFromSubscriptions;
          this.setState(temp);
          this.dataProps = nextProps;
        });
      }
    }

    componentWillUnmount() {
      let copySubs = Object.assign({}, this.subs);
      pubSubStore.cancelSubContainer(this);
      this.cancelSubscriptions();
      this.doAutoRun();
      delete this.doAutoRun;
      this.garbageCollector(copySubs);
    }

    render() {
      return <Component {...this.state} options={this.props.options} {...this.props} />;
    }

    get getLoadersFromSubscriptions() {
      const subsForContainer = _.filter(pubSubStore.subs, (s) => {
        return _.find(_.keys(this.subs), (subName) => {
          return subName === s.publicationNameWithParams;
        });
      });
      return _.sumBy(subsForContainer, 'loaders');
    }
    @action
    subscribe(publicationName, params, isReactive) {
      const publicationNameWithParams = publicationName + '?' + this.buildParams(params);

      if (this.subs.hasOwnProperty(publicationNameWithParams)) {
        return;
      }

      // Notify store
      pubSubStore.subscribe(publicationNameWithParams, isReactive);

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
    get getDataStore() {
      return dataStore;
    }

    /**
     * Returns a specific collection from the data store.
     *
     * @param collectionName
     */
    getCollection(collectionName) {
      dataStore.createCollectionIfNotExists(collectionName);

      return dataStore.collections[collectionName];
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
