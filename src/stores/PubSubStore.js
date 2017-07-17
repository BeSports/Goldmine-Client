import { observable, action } from 'mobx';
import _ from 'lodash';

class PubSubStore {
  @observable subs = [];

  /**
   * Subscribes to a publication.
   *
   * @param publicationNameWithParams
   * @param isReactive
   * @param options
   */
  @action
  subscribe(publicationNameWithParams, isReactive, options) {
    const sub = _.find(this.subs, { publicationNameWithParams: publicationNameWithParams });

    if (sub === undefined) {
      this.subs.push({ publicationNameWithParams, isReactive, options, loaders: 1 });
    }
  }

  /**
   * Cancels a subscription for a publication.
   *
   * @param publicationNameWithParams
   */
  @action
  cancelSubscription(publicationNameWithParams) {
    _.remove(this.subs, { publicationNameWithParams: publicationNameWithParams });
  }
}

export default new PubSubStore();
