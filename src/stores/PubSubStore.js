import { observable, action } from 'mobx';
import _ from 'lodash';
import mobx from 'mobx';
import DataStore from './DataStore';

class PubSubStore {
  @observable subs = [];
  @observable subContainers = [];

  /**
   * Subscribes to a publication.
   *
   * @param publicationNameWithParams
   * @param isReactive
   */
  @action
  subscribe(publicationNameWithParams, isReactive) {
    const sub = _.find(this.subs, { publicationNameWithParams });
    if (sub === undefined) {
      this.subs.push({ publicationNameWithParams, isReactive, loaders: 1, times: 1 });
    } else {
      const newTimes = sub.times + 1;
      this.subs[
        _.findIndex(this.subs, { publicationNameWithParams })
      ] = _.merge({}, sub, { times: newTimes });
    }
  }

  /**
   * Cancels a subscription for a publication.
   *
   * @param publicationNameWithParams
   */
  @action
  cancelSubscription(publicationNameWithParams) {
    const sub = _.find(this.subs, { publicationNameWithParams });
    if (sub) {
      if (sub.times === 1) {
        const index = _.findIndex(this.subs, { publicationNameWithParams });
        this.subs.splice(index, 1);
        DataStore.garbageCollector(publicationNameWithParams);
      } else if (sub.times >= 2) {
        const newTimes = sub.times - 1;
        this.subs[
          _.findIndex(this.subs, { publicationNameWithParams })
        ] = _.merge({}, sub, { times: newTimes });
      }
    }
  }

  @action
  registerSubContainer(subContainer) {
    this.subContainers.push(subContainer);
  }

  @action
  cancelSubContainer(subContainer) {
    const index = _.findIndex(this.subContainers, subContainer );
    this.subContainers.splice(index, 1);
  }
}

export default new PubSubStore();
