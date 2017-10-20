import React from 'react';
import { autorun } from 'mobx';
import io from 'socket.io-client';
import _ from 'lodash';

import Config from './Config';

import pubSubStore from './stores/PubSubStore';
import dataStore from './stores/DataStore';

/**
 * Main container is responsible for fetching data
 * and managing subscriptions. Which will be reported to the store.
 */

export default class MainContainer extends React.Component {
  constructor(props) {
    super(props);
    this.subs = {};
    this.socket = io(props.host);
    if (props.driver) {
      dataStore.setPrimaryKey(Config.drivers[props.driver]);
    } else {
      console.log('GOLDMINE NoDriver provided: Please provide a driver to the maincontainer.');
      throw new Error('Please provide a driver to the maincontainer', 'GOLDMINE No-driver');
    }
  }

  componentWillMount() {
   this.startSocket();
    autorun(() => {
      this.handleSubscriptions(pubSubStore.subs);
    });
  }

  componentWillUnmount() {
    this.socket.close();
  }

  startSocket() {
    if (this.props.auth) {
      this.socket.on('connect', () => {
        this.socket.emit('authenticate', this.props.auth);
      });
      this.socket.on('disconnect', () => {
        if (typeof this.props.onDisconnect === 'function') {
          this.props.onDisconnect();
        }
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (JSON.stringify(nextProps) !== JSON.stringify(this.props)) {
      PubSubStore.subs.clear();
      PubSubStore.subContainers.clear();
      dataStore.collections.clear();
      this.socket.close();
      this.socket = io(nextProps.host);
      this.startSocket();
    }
  }

  render() {
    return null;
  }

  /**
   * Adds or removes subscriptions.
   *
   * @param newSubs
   */
  handleSubscriptions(newSubs) {
    // Add new subs
    _.forEach(newSubs, obj => {
      if (!this.subs.hasOwnProperty(obj.publicationNameWithParams)) {
        let listener = payload => {
          console.log(payload, obj.publicationNameWithParams);
          dataStore.change(obj.publicationNameWithParams, payload, obj.options);
          pubSubStore.subs = _.map(pubSubStore.subs, subscription => {
            if (subscription.publicationNameWithParams === obj.publicationNameWithParams) {
              const clone = _.cloneDeep(subscription);
              clone.loaders = 0;
              return clone;
            }
            return subscription;
          });
          _.map(pubSubStore.subContainers, sc => {
            if (sc.subs && _.includes(_.keys(sc.subs), obj.publicationNameWithParams)) {
              sc.doAutoRun();
            }
          });
        };

        this.subs[obj.publicationNameWithParams] = listener;

        this.socket.on(obj.publicationNameWithParams, listener);
        this.socket.emit('subscribe', {
          publicationNameWithParams: obj.publicationNameWithParams,
          isReactive: obj.isReactive,
          options: obj.options,
        });
      }
    });

    // Remove subs
    _.forEach(this.subs, (value, key) => {
      const exists = _.find(newSubs, obj => {
        return obj.publicationNameWithParams === key;
      });

      if (exists === undefined) {
        this.socket.emit('unsubscribe', { publicationNameWithParams: key });
        this.socket.removeListener(key, value);

        delete this.subs[key];
      }
    });
  }
}
