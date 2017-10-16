import { observable, action } from 'mobx';
import _ from 'lodash';
import mobx from 'mobx';

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
    const sub = _.find(this.subs, { publicationNameWithParams: publicationNameWithParams });
    if (sub === undefined) {
      this.subs.push({ publicationNameWithParams, isReactive, loaders: 1, times: 1 });
    } else {
      const newTimes = sub.times + 1;
      this.subs[
        _.findIndex(this.subs, { publicationNameWithParams: publicationNameWithParams })
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
    const sub = _.find(this.subs, { publicationNameWithParams: publicationNameWithParams });
    if (sub) {
      if (sub.times === 1) {
        _.remove(this.subs, { publicationNameWithParams: publicationNameWithParams });
      } else if (sub.times >= 2) {
        const newTimes = sub.times - 1;
        this.subs[
          _.findIndex(this.subs, { publicationNameWithParams: publicationNameWithParams })
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
    _.remove(this.subContainers, subContainer);
  }
}

export default new PubSubStore();
