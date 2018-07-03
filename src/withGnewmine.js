import deepDifference from 'deep-diff';
import _ from 'lodash';
import base64 from 'base-64';
import GnewmineStore from './stores/GnewmineStore';

import React from 'react';
import { runInAction, action } from 'mobx';
import { toJS } from 'mobx/lib/mobx';
import hoistNonReactStatics from 'hoist-non-react-statics';

const withGnewmine = (Component, subscriptions) => {
  class WithGnewmineInside extends React.Component {
    render() {
      return (
        <WithGnewmine
          gm={true}
          Component={Component}
          subscriptions={subscriptions}
          {...this.props}
        />
      );
    }
  }

  return hoistNonReactStatics(WithGnewmineInside, Component);
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
    this.checkSubscriptions = this.checkSubscriptions.bind(this);
    this.cancelSubscriptionsWithoutRecentCheck = this.cancelSubscriptionsWithoutRecentCheck.bind(
      this,
    );

    this.state = {
      loaded: false,
      data: {},
    };
    this.subs = [];
  }

  componentWillReceiveProps(nextProps) {
    this.doGnewMine(nextProps, this.props);
  }

  componentWillMount() {
    GnewmineStore.registerWithGnewmine(this);
    this.doAutoRun = () => {
      this.doGnewMine(this.props, {});
    };
    this.doAutoRun();
  }

  componentWillUnmount() {
    this.cancelSubscriptionsWithoutRecentCheck();
    GnewmineStore.cancelWithGnewmine(this);
  }

  doGnewMine(nextProps, prevProps) {
    if (JSON.stringify(nextProps) !== JSON.stringify(prevProps)) {
      // Run changes in transaction.
      // When transaction is complete the necessary updates will take place.
      runInAction(() => {
        this.recentChecks = [];
        this.nextProps = nextProps;
        const subscriptionsToSend = this.getSubscriptionsToSend(nextProps);
        if (this.subs !== subscriptionsToSend) {
          this.checkSubscriptions(subscriptionsToSend);
          this.cancelSubscriptionsWithoutRecentCheck();
        }
        this.setState({
          data: this.getDataObject,
          loaded: this.getLoaded,
        });
      });
    }
  }

  // checks all subscriptions for new subscrtiptions
  @action
  checkSubscriptions(subscriptionsToSend) {
    _.forEach(subscriptionsToSend, publicationNameWithParams => {
      this.recentChecks = _.concat(this.recentChecks, publicationNameWithParams);
      if (_.includes(this.subs, publicationNameWithParams)) {
        // was already subscribed
        return;
      }
      GnewmineStore.subscribe(publicationNameWithParams);
      this.subs.push(publicationNameWithParams);
    });
  }

  // removes all subscriptions which were not needed anymore
  cancelSubscriptionsWithoutRecentCheck() {
    _.forEach(this.subs, publicationNameWithParams => {
      if (!_.includes(this.recentChecks, publicationNameWithParams)) {
        GnewmineStore.cancelSubscription(publicationNameWithParams);
        delete this.subs[_.indexOf(this.subs, publicationNameWithParams)];
      }
    });
    this.recentChecks = [];
  }

  getSubscriptionsToSend(props) {
    const subscriptionsFunction = props.subscriptions;
    const subscriptions = subscriptionsFunction(props);
    const subscriptionsToSend = _.map(subscriptions, subscription => {
      return `${subscription.publication}?${this.buildParams(
        _.merge(
          subscription.private === true ? { userId: GnewmineStore.userId } : {},
          subscription.props,
        ),
      )}`;
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

  get getDataObject() {
    return _.reduce(
      _.filter(GnewmineStore.subscriptions, publication => {
        return _.includes(this.subs, publication.publicationNameWithParams);
      }),
      (data, dataPart) => {
        return _.merge(data, toJS(dataPart.data));
      },
      {},
    );
  }

  get getLoaded() {
    return _.every(
      _.filter(GnewmineStore.subscriptions, publication => {
        return _.includes(this.subs, publication.publicationNameWithParams);
      }),
      o => {
        return o.loaded === true;
      },
    );
  }

  render() {
    const { Component } = this.props;
    const { data, loaded } = this.state;
    return <Component data={data} loaded={loaded} {...this.props} />;
  }
}

export default withGnewmine;
