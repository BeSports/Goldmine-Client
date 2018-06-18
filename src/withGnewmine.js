import GnewminePusher from './GnewminePusher';
import axios from 'axios';
import deepDifference from 'deep-diff';
import _ from 'lodash';
import base64 from 'base-64';

import React from 'react';

const withGnewmine = (Component, subscriptions) => {
  return props => {
    return (
      <GnewminePusher.Consumer>
        {socket => {
          return (
            <WithGnewmine
              {...props}
              socket={socket}
              Component={Component}
              subscriptions={subscriptions}
            />
          );
        }}
      </GnewminePusher.Consumer>
    );
  };
};

class WithGnewmine extends React.Component {
  constructor() {
    super();
    this.applyUpdate = this.applyUpdate.bind(this);
    this.buildParams = this.buildParams.bind(this);
    this.getSubscriptionsToSend = this.getSubscriptionsToSend.bind(this);
    this.toPusherName = this.toPusherName.bind(this);
    this.extractPublicationName = this.extractPublicationName.bind(this);
    this.doGnewMine = this.doGnewMine.bind(this);

    this.state = {
      loaded: false,
      data: {},
    };
  }

  componentWillReceiveProps(nextProps) {
    this.doGnewMine(nextProps, this.props);
  }

  doGnewMine(props, prevProps) {
    const toOmit = ['Component', 'socket', 'match', 'location', 'history'];
    if (
      prevProps &&
      JSON.stringify(_.omit(props, toOmit)) === JSON.stringify(_.omit(prevProps, toOmit))
    ) {
      return;
    }

    const { socket } = props;
    const headers = {};
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      headers['x-access-token'] = jwt;
      if (sessionStorage.getItem('impersonatedJwt')) {
        headers['x-impersonate-jwt'] = sessionStorage.getItem('impersonatedJwt');
      }
    }

    const subscriptionsToSend = this.getSubscriptionsToSend(props);

    if (_.size(subscriptionsToSend) === 0) {
      return;
    }

    const options = {
      url: process.env.GNEWMINE_SERVER,
      headers,
      method: 'POST',
      data: {
        subscriptions: subscriptionsToSend,
      },
      mode: 'cors',
    };
    axios(options).then(response => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('GNM init', subscriptionsToSend, response.data);
      }
      this.setState({
        data: response.data,
        loaded: true,
      });
    });

    const applyUpdate = this.applyUpdate;

    _.map(subscriptionsToSend, subscription => {
      const channel = socket.subscribe(this.toPusherName(subscription));
      channel.bind('update', data => {
        if (process.env.NODE_ENV !== 'production') {
          console.log('GNM update', subscriptionsToSend, data.diff);
        }
        applyUpdate(data.diff);
      });
    });
  }

  componentWillMount() {
    this.doGnewMine(this.props);
  }

  getSubscriptionsToSend(props) {
    const subscriptionsFunction = props.subscriptions;

    const subscriptions = subscriptionsFunction(props);
    const subscriptionsToSend = _.map(subscriptions, subscription => {
      return `${subscription.publication}?${this.buildParams(subscription.props)}`;
    });

    return subscriptionsToSend;
  }

  toPusherName(subscriptionName) {
    const publicationName = this.extractPublicationName(subscriptionName);
    const key = subscriptionName.indexOf('?');
    const params = subscriptionName.substring(key + 1);
    const encodedParamsString = base64.encode(params);
    const pusherName = `${publicationName}_${encodedParamsString}`;
    return pusherName;
  }

  extractPublicationName(subscription) {
    const key = subscription.indexOf('?');
    let roomName = subscription;

    if (key !== -1) {
      roomName = subscription.substring(0, key);
    }

    return roomName;
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

  applyUpdate(differences) {
    const newData = _.cloneDeep(this.state.data);
    _.each(differences, singleDiff => {
      deepDifference.applyChange(newData, {}, singleDiff);
    });
    this.setState({
      data: newData,
    });
  }

  componentWillUnmount() {
    const { socket } = this.props;

    _.map(this.getSubscriptionsToSend(this.props), subscription => {
      socket.unsubscribe(this.toPusherName(subscription));
    });
  }

  render() {
    const { Component } = this.props;
    const { data, loaded } = this.state;
    return <Component data={data} loaded={loaded} {...this.props} />;
  }
}

export default withGnewmine;
