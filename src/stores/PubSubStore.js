import { observable, action } from 'mobx';
import _ from 'lodash';

class PubSubStore {
  @observable subs = [];

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
      this.subs.push({ publicationNameWithParams, isReactive });
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
