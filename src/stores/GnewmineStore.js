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
  @observable disconnected = false;
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

    if (index > -1) {
      this.subscriptions[index] = _.merge({}, this.subscriptions[index], {
        data,
        loaded: true,
      });
    }
    this.updateContainers(publicationNameWithParams, this.containers);

    const channel = this.socket.subscribe(this.toPusherName(publicationNameWithParams));
    channel.bind('update', newData => {
      if (process.env.NODE_ENV !== 'production') {
        console.log('GNM update', publicationNameWithParams, newData.diff);
      }
      this.setDifference(publicationNameWithParams, newData.diff);
      this.updateContainers(publicationNameWithParams, this.containers);
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
    }
  }

  @action
  async reinitSubscription(publicationNameWithParams) {
    const data = await this.getSubscriptionDataFromApi(publicationNameWithParams);

    // add the new subscription its data
    const index = _.findIndex(this.subscriptions, { publicationNameWithParams });

    if (index > -1) {
      this.subscriptions[index] = {
        publicationNameWithParams: this.subscriptions[index].publicationNameWithParams,
        times: this.subscriptions[index].times,
        data,
        loaded: true,
      };
    }
    this.updateContainers(publicationNameWithParams, this.containers);
  }

  @action
  setSocket(socket) {
    this.socket = socket;
  }

  @action
  setHeaders(headers) {
    if (!this.headers || headers['x-access-token'] !== this.headers['x-access-token']) {
      console.log('Setting headers', headers);
      this.headers = headers;
      this.triggerAll(this.containers);
    }
  }

  @action
  setUserId(userId) {
    if (userId !== this.userId) {
      console.log('Setting userId', userId);
      this.userId = userId;
      this.triggerAll(this.containers);
    }
  }

  @action
  setHost(host) {
    if (host !== this.host) {
      console.log('Setting host', host);
      this.host = host;
      this.triggerAll(this.containers);
    }
  }

  @action
  setDisconnected(disconnected) {
    if (disconnected !== this.disconnected && disconnected) {
      console.log('SETDISCONNECTED', toJS(this.containers), this.containers.subs);
      const oldContainers = _.slice(this.containers);
      _.forEach(oldContainers, container => {
        _.forEach(container.subs, sub => {
          console.log('SUB', sub);
          if (sub) {
            this.reinitSubscription(sub);
            // this.cancelSubscription(sub);
            // this.initiateSubscription(sub);
          }
        });
      });
      // _.forEach(oldContainers, container => {
      //   _.forEach(container.subs, sub => {
      //     console.log('SUB', sub);
      //     if (sub) {
      //       // this.cancelSubscription(sub);
      //       this.subscribe(sub);
      //     }
      //   });
      // });
      // this.triggerAll(this.containers);
    }
    this.disconnected = disconnected;
  }

  @action
  setDifference(publicationNameWithParams, differences) {
    const index = _.findIndex(this.subscriptions, { publicationNameWithParams });

    if (index >= 0) {
      const newData = toJS(this.subscriptions[index].data);
      _.each(differences, singleDiff => {
        deepDifference.applyChange(newData, {}, singleDiff);
      });
      this.subscriptions[index] = _.merge({}, _.omit(this.subscriptions[index], 'data'), {
        data: newData,
      });
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
    console.log('we getting triggered here', toJS(containers));
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
