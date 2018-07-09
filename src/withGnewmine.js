import deepDifference from 'deep-diff';
import _ from 'lodash';
import base64 from 'base-64';
import GnewmineStore from './stores/GnewmineStore';

import React from 'react';
import { runInAction, action } from 'mobx';
import { toJS } from 'mobx/lib/mobx';
import VisibilitySensor from 'react-visibility-sensor';

const withGnewmine = (Component, subscriptions) => {
  return props => {
    return (
      <WithGnewmine gm={true} Component={Component} subscriptions={subscriptions} {...props} />
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
    this.checkSubscriptions = this.checkSubscriptions.bind(this);
    this.getPossibleToLoadMoreOf = this.getPossibleToLoadMoreOf.bind(this);
    this.setVisible = this.setVisible.bind(this);
    this.incrementLimit = this.incrementLimit.bind(this);
    this.getLoaded = this.getLoaded.bind(this);
    this.cancelSubscriptionsWithoutRecentCheck = this.cancelSubscriptionsWithoutRecentCheck.bind(
      this,
    );

    this.state = {
      loaded: false,
      data: {},
      isVisible: false,
      showSensor: false,
      incrementing: false,
    };

    this.subs = [];
    this.loadMore = {};
    this.counters = {};
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
        this.getPossibleToLoadMoreOf();
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
        const removeSubscription = () => {
          GnewmineStore.cancelSubscription(publicationNameWithParams);
          delete this.subs[_.indexOf(this.subs, publicationNameWithParams)];
        };
        if (this.state.incrementing) {
          setTimeout(removeSubscription, 2000);
        } else {
          removeSubscription();
        }
      }
    });
    this.recentChecks = [];
  }

  getSubscriptionsToSend(props) {
    const subscriptionsFunction = props.subscriptions;
    const subscriptions = subscriptionsFunction(props);
    const subscriptionsToSend = _.map(subscriptions, subscription => {
      const publicationName = `${subscription.publication}?${this.buildParams(
        _.merge(
          subscription.private === true ? { userId: GnewmineStore.userId } : {},
          subscription.props,
          subscription.loadMore
            ? {
                limit: _.get(
                  this.counters,
                  `${subscription.publication}.counter`,
                  subscription.loadMore.initial,
                ),
              }
            : {},
        ),
      )}`;
      if (subscription.loadMore) {
        _.set(
          this.loadMore,
          subscription.publication,
          _.merge(subscription, { publicationNameWithParams: publicationName }),
        );
        if (!_.has(this.counters, subscription.publication)) {
          _.set(this.counters, subscription.publication, {
            publication: subscription.publication,
            counter: subscription.loadMore.initial || 10,
          });
        }
      }
      return publicationName;
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
    this.getPossibleToLoadMoreOf();
  }

  getPossibleToLoadMoreOf() {
    _.filter(this.loadMore, subscriptionToLoadMore => {
      const subscriptionData = _.find(GnewmineStore.subscriptions, [
        'publicationNameWithParams',
        subscriptionToLoadMore.publicationNameWithParams,
      ]);
      const size = _.has(subscriptionData, 'data')
        ? _.size(_.find(_.values(subscriptionData.data)))
        : 0;
      if (
        size >= _.find(this.counters, ['publication', subscriptionToLoadMore.publication]).counter
      ) {
        _.set(this.counters, `${subscriptionToLoadMore.publication}.hasMore`, true);
      } else {
        _.set(this.counters, `${subscriptionToLoadMore.publication}.hasMore`, false);
      }
    });
    setTimeout(() => {
      this.setState({
        showSensor: true,
      });
    }, 500);
  }

  setVisible(state) {
    if (this.getLoaded() && state === true) {
      this.setState(
        {
          isVisible: state,
          showSensor: !state,
          incrementing: true,
        },
        () => {
          if (state) {
            this.incrementLimit();
          }
        },
      );
    }
  }

  incrementLimit() {
    let newSubs = this.subs;
    _.map(this.counters, counter => {
      const pub = _.find(this.loadMore, ['publication', counter.publication]);
      const newSub = `${pub.publication}?${this.buildParams(
        _.merge(pub.private === true ? { userId: GnewmineStore.userId } : {}, pub.props, {
          limit: counter.counter + pub.loadMore.increment,
        }),
      )}`;
      _.set(this.counters, `${pub.publication}.counter`, counter.counter + pub.loadMore.increment);
      newSubs = _.without(newSubs, pub.publicationNameWithParams);
      newSubs.push(newSub);
    });
    runInAction(() => {
      if (this.subs !== newSubs) {
        this.checkSubscriptions(newSubs);
        this.cancelSubscriptionsWithoutRecentCheck();
      }
      this.setState({
        data: this.getDataObject,
      });
    });
    this.getPossibleToLoadMoreOf();
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

  getLoaded() {
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
    const { Component, containmentId } = this.props;
    const { data, showSensor, incrementing } = this.state;
    const loaded = this.getLoaded();
    const hasScrollup = _.find(this.loadMore, ['loadMore.scrollUp', true]);
    const hasMore = _.find(this.counters, ['hasMore', true]);

    const sensor = (
      <VisibilitySensor
        onChange={this.setVisible}
        partialVisibility
        containment={document.getElementById(containmentId)}
      />
    );

    return (
      <React.Fragment>
        {hasScrollup &&
          loaded &&
          showSensor &&
          hasMore && (
            <React.Fragment>
              {sensor}
              Loading...
            </React.Fragment>
          )}
        <Component data={data} loaded={loaded || incrementing} {...this.props} />
        {!hasScrollup &&
          loaded &&
          showSensor &&
          hasMore && (
            <React.Fragment>
              Loading...
              {sensor}
            </React.Fragment>
          )}
      </React.Fragment>
    );
  }
}

export default withGnewmine;
