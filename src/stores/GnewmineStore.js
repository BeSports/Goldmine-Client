import { observable, action, toJS } from 'mobx';
import _ from 'lodash';
import deepDifference from 'deep-diff';
import base64 from 'base-64';
import axios from 'axios';

class GnewmineStore {
  @observable subscriptions = [];
  @observable socket = null;
  @observable headers = null;
  @observable userId = null;
  @observable host = null;
  @observable forceUpdate = false;
  @observable onServerDisconnect = null;
  @observable containers = [];

  constructor() {
    this.primaryKey = '';
  }

  /**
   * Subscribes to a publication.
   *
   * @param publicationNameWithParams
   * @param isReactive
   */
  @action
  subscribe(publicationNameWithParams) {
    const sub = _.find(this.subscriptions, { publicationNameWithParams });
    if (sub === undefined) {
      this.subscriptions.push({ publicationNameWithParams, loaded: false, times: 1 });
      this.initiateSubscription(publicationNameWithParams);
    } else {
      const newTimes = sub.times + 1;
      this.subscriptions[_.findIndex(this.subscriptions, { publicationNameWithParams })] = _.merge(
        {},
        sub,
        { times: newTimes },
      );
    }
  }

  /**
   * Cancels a subscription for a publication.
   *
   * @param publicationNameWithParams
   */
  @action
  cancelSubscription(publicationNameWithParams) {
    const sub = _.find(this.subscriptions, { publicationNameWithParams });
    if (sub) {
      if (sub.times === 1) {
        const index = _.findIndex(this.subscriptions, { publicationNameWithParams });
        this.subscriptions.splice(index, 1);
        this.socket.unsubscribe(this.toPusherName(publicationNameWithParams));
      } else if (sub.times >= 2) {
        const newTimes = sub.times - 1;
        this.subscriptions[
          _.findIndex(this.subscriptions, { publicationNameWithParams })
        ] = _.merge({}, sub, { times: newTimes });
      }
    }
  }

  @action
  async initiateSubscription(publicationNameWithParams) {
    const data = await this.getSubscriptionDataFromApi(publicationNameWithParams);

    // add the new subscription its data
    const index = _.findIndex(this.subscriptions, { publicationNameWithParams });

    if (data && index > -1) {
      this.subscriptions[index] = _.merge({}, this.subscriptions[index], {
        data: data.data,
        updateIds: [data.updateId],
        loaded: true,
      });
    }
    this.updateContainers(publicationNameWithParams, this.containers);

    const channel = this.socket.subscribe(this.toPusherName(publicationNameWithParams));
    channel.bind('update', newData => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('GNM update', publicationNameWithParams, newData);
      }
      this.setDifference(
        publicationNameWithParams,
        newData.diff,
        newData.lastUpdateId,
        newData.updateId,
      );
    });
  }

  @action
  async getSubscriptionDataFromApi(publicationNameWithParams) {
    try {
      let headers = {};
      if (this.headers) {
        headers = _.merge(headers, this.headers);
      }

      const options = {
        url: this.host || process.env.GNEWMINE_SERVER,
        headers,
        method: 'POST',
        data: {
          subscriptions: [publicationNameWithParams],
        },
        mode: 'cors',
      };

      const response = await axios(options);
      if (process.env.NODE_ENV !== 'production') {
        console.log('GNM (re)init', publicationNameWithParams, response.data);
      }
      return response.data;
    } catch (e) {
      console.log('Couldnt connect to api', e);
      this.onServerDisconnect("Can't connect to API server");
      return null;
    }
  }

  @action
  async reinitSubscription(publicationNameWithParams) {
    const data = await this.getSubscriptionDataFromApi(publicationNameWithParams);

    // add the new subscription its data
    const index = _.findIndex(this.subscriptions, { publicationNameWithParams });

    if (data && index > -1) {
      this.subscriptions[index] = {
        publicationNameWithParams: this.subscriptions[index].publicationNameWithParams,
        times: this.subscriptions[index].times,
        data: data.data,
        updateIds: [data.updateId],
        loaded: true,
      };
    }
    this.updateContainers(publicationNameWithParams, this.containers);
  }

  @action
  setSocket(socket) {
    if (!this.socket || (socket && socket.key !== this.socket.key)) {
      this.socket = socket;
    }
  }

  @action
  setHeaders(headers) {
    if (!this.headers || headers['x-access-token'] !== this.headers['x-access-token']) {
      this.headers = headers;
      this.triggerAll(this.containers);
    }
  }

  @action
  setUserId(userId) {
    if (userId !== this.userId) {
      this.userId = userId;
      this.triggerAll(this.containers);
    }
  }

  @action
  setHost(host) {
    if (host !== this.host) {
      this.host = host;
      this.triggerAll(this.containers);
    }
  }

  @action
  setOnServerDisconnect(onServerDisconnect) {
    if (_.isFunction(onServerDisconnect)) {
      if (onServerDisconnect !== this.onServerDisconnect) {
        this.onServerDisconnect = onServerDisconnect;
      }
    } else {
      this.onServerDisconnect = () => {};
    }
  }

  @action
  setForceUpdate(forceUpdate) {
    if (forceUpdate && forceUpdate !== this.forceUpdate) {
      const oldContainers = _.slice(this.containers);
      _.forEach(oldContainers, container => {
        _.forEach(container.subs, sub => {
          if (sub) {
            this.reinitSubscription(sub);
          }
        });
      });
    }
    this.forceUpdate = forceUpdate;
  }

  @action
  setDifference(publicationNameWithParams, differences, lastUpdateId, updateId) {
    const index = _.findIndex(this.subscriptions, { publicationNameWithParams });

    if (index >= 0) {
      const newData = toJS(this.subscriptions[index].data);

      const { updateIds: lastUpdateIdsLocal } = this.subscriptions[index];

      // If we didn't receive the last(=previous) update => reinitSubscription
      if (!_.includes(lastUpdateIdsLocal, lastUpdateId)) {
        this.reinitSubscription(publicationNameWithParams);
      } else {
        _.each(differences, singleDiff => {
          deepDifference.applyChange(newData, {}, singleDiff);
        });
        lastUpdateIdsLocal.push(updateId);
        this.subscriptions[index] = _.merge(
          {},
          _.omit(this.subscriptions[index], ['data', 'updateIds']),
          {
            data: newData,
            updateIds: _.takeRight(lastUpdateIdsLocal, 10),
          },
        );
        this.updateContainers(publicationNameWithParams, this.containers);
      }
    }
  }

  updateContainers(publicationNameWithParams, containers) {
    _.forEach(toJS(containers), container => {
      if (
        container &&
        container.subs &&
        _.includes(toJS(container.subs), publicationNameWithParams)
      ) {
        container.doAutoRun();
      }
    });
  }

  triggerAll(containers) {
    _.forEach(toJS(containers), container => {
      container.doAutoRun();
    });
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

  @action
  registerWithGnewmine(container) {
    this.containers.push(container);
  }

  @action
  cancelWithGnewmine(container) {
    const index = _.findIndex(this.containers, container);
    this.containers.splice(index, 1);
  }
}

export default new GnewmineStore();
