import GoldMine from './GoldMine';
import PropTypes from 'prop-types';

import React from 'react';
import _ from 'lodash';

const WithSubscriptions = (WrappedComponent, subscriptions) => {
  return class extends React.PureComponent {
    constructor(props) {
      super(props);
    }
    render() {
      return <GoldMine subscriptions={subscriptions} component={WrappedComponent} />;
    }
  };
};

export default WithSubscriptions;
