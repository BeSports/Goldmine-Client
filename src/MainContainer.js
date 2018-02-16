import React from 'react';
import { autorun, toJS } from 'mobx';
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
    this.state = {
      updateLogs: props.updateLogs,
      initLogs: props.initLogs,
    };
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
        if (typeof this.props.onConnect === 'function') {
          this.props.onConnect('server', 'Connected');
        }
      });
      this.socket.on('disconnect', t => {
        if (typeof this.props.onDisconnect === 'function') {
          if (t === 'io server disconnect') {
            this.props.onDisconnect('server', 'Wrong jwt');
          } else if (t === 'transport close') {
            this.props.onDisconnect('server', 'Goldmine-server went down');
          } else {
            this.props.onDisconnect(
              _.includes(t, 'client') ? 'client' : 'server',
              _.includes(t, 'client') ? 'A client side disconnect' : 'A server side disconnect',
            );
          }
        }
      });
      this.socket.on('connect_error', t => {
        this.props.onDisconnect('client', 'No connection was established to the server');
      });
      this.socket.on('connect_timeout', t => {
        this.props.onDisconnect('client', 'Connection to the server timed out');
      });
    }
  }

  componentWillReceiveProps(nextProps) {
    if (JSON.stringify(nextProps) !== JSON.stringify(this.props)) {
      pubSubStore.subs.clear();
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
          if (this.state.initLogs) {
            console.log(payload);
          }
          dataStore.change(payload, this.state.updateLogs);
          pubSubStore.subs = _.map(pubSubStore.subs, subscription => {
            // set the loaders of the correct subscritpion to 0
            if (
              subscription.publicationNameWithParams === obj.publicationNameWithParams &&
              payload.type === 'init'
            ) {
              const clone = _.cloneDeep(subscription);
              clone.loaders = 0;
              return clone;
            }
            return subscription;
          });
          // rerender the containers whom are subscribing to the publication
          _.map(pubSubStore.subContainers, sc => {
            if (sc && sc.subs && _.includes(_.keys(toJS(sc.subs)), obj.publicationNameWithParams)) {
              sc.doAutoRun();
            }
          });
        };

        this.subs[obj.publicationNameWithParams] = listener;

        this.socket.on(obj.publicationNameWithParams, listener);
        this.socket.emit('subscribe', {
          publicationNameWithParams: obj.publicationNameWithParams,
          isReactive: obj.isReactive,
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
