import GoldMine from './GoldMine';
import hoistNonReactStatics from 'hoist-non-react-statics';

import React from 'react';

const withGoldmine = (WrappedComponent, subscriptions) => {
  class WithGoldmine extends React.PureComponent {
    render() {
      return (
        <GoldMine
          subscriptions={subscriptions(this.props || {})}
          component={WrappedComponent}
          {...this.props}
        />
      );
    }
  }
  return hoistNonReactStatics(WithGoldmine, WrappedComponent);
};

export default withGoldmine;
