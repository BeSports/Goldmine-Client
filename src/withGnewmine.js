import GnewminePusher from './GnewminePusher';
import axios from 'axios';
import deepDifference from 'deep-diff';
import _ from 'lodash';
import base64 from 'base-64';

import React from 'react';
import extractPublicationName from '../../gnewmine/src/helpers/extractPublicationName';

const withGnewmine = (Component, subscriptions) => {
  return props => {
    return (
      <GnewminePusher.Consumer>
        {socket => (
          <WithGnewmine
            {...props}
            socket={socket}
            Component={Component}
            subscriptions={subscriptions}
          />
        )}
      </GnewminePusher.Consumer>
    );
  };
};

class WithGnewmine extends React.Component {
  constructor() {
    super();
    this.applyUpdate = this.applyUpdate.bind(this);
    this.buildParams = this.buildParams.bind(this);
    this.toPusherName = this.toPusherName.bind(this);
    this.state = {
      loaded: false,
      data: {},
    };
  }

  componentWillMount() {
    const { socket } = this.props;
    const subscriptionsFunction = this.props.subscriptions;
    const headers = {};
    const jwt = localStorage.getItem('jwt');
    if (jwt) {
      headers['x-access-token'] = jwt;
    }

    const subscriptions = subscriptionsFunction(this.props);
    const subscriptionsToSend = _.map(subscriptions, subscription => {
      return `${subscription.publication}?${this.buildParams(subscription.props)}`;
    });

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
      this.setState({
        data: response.data,
        loaded: true,
      });
    });

    const applyUpdate = this.applyUpdate;

    _.map(subscriptionsToSend, subscription => {
      const channel = socket.subscribe(this.toPusherName(subscription));
      channel.bind('update', data => {
        applyUpdate(data.diff);
      });
    });
  }

  toPusherName = subscriptionName => {
    const publicationName = extractPublicationName(subscriptionName);
    const key = subscriptionName.indexOf('?');
    const params = subscriptionName.substring(key + 1);
    const encodedParamsString = base64.encode(params);
    const pusherName = `${publicationName}_${encodedParamsString}`;
    return pusherName;
  };

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

    socket.unsubscribe('storyForId');
  }

  render() {
    const { Component } = this.props;
    const { data, loaded } = this.state;

    return <Component data={data} loaded={loaded} {...this.props} />;
  }
}

export default withGnewmine;
