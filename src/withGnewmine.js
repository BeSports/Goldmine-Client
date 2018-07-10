import React from 'react';
import hoistNonReactStatics from 'hoist-non-react-statics';
import GnewMine from './GnewMine';

const withGnewmine = (Component, subscriptions) => {
  class WithGnewmine extends React.Component {
    render() {
      return <GnewMine gm Component={Component} subscriptions={subscriptions} {...this.props} />;
    }
  }

  return hoistNonReactStatics(WithGnewmine, Component);
};

export default withGnewmine;
