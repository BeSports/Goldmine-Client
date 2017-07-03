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

    dataStore.setPrimaryKey(Config.drivers[props.driver]);
  }

  componentWillMount() {
    autorun(() => {
      this.handleSubscriptions(pubSubStore.subs);
    });
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
          console.log(payload);

          dataStore.change(obj.publicationNameWithParams, payload, obj.options);
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
