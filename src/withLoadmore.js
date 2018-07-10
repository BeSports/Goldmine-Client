import _ from 'lodash';
import React from 'react';
import VisibilitySensor from 'react-visibility-sensor';
import hoistNonReactStatics from 'hoist-non-react-statics';
import GnewMine from './GnewMine';
import PropTypes from 'prop-types';

const withLoadmore = (Component, subscriptions) => {
  class WithLoadmore extends React.Component {
    constructor() {
      super();
      this.setVisible = this.setVisible.bind(this);
      this.isThereMore = this.isThereMore.bind(this);
      this.triggerIncrement = this.triggerIncrement.bind(this);
      this.state = {
        isMoreAvailable: false,
        allowSensor: false,
        increment: false,
        incrementing: false,
      };
    }

    setVisible(state) {
      if (state) {
        this.setState(
          {
            visible: state,
            allowSensor: !state,
            incrementing: true,
          },
          this.triggerIncrement,
        );
      }
    }

    isThereMore(counters) {
      this.setState({
        isMoreAvailable: _.find(counters, ['hasMore', true]),
        allowSensor: true,
        increment: false,
      });
    }

    triggerIncrement() {
      if (this.state.isMoreAvailable && this.state.visible) {
        this.setState({
          visible: false,
          increment: true,
        });
      }
    }

    render() {
      const { containmentId, scrollUp, Loader } = this.props;
      const { increment, allowSensor, isMoreAvailable, incrementing } = this.state;
      const sensor = (
        <VisibilitySensor
          onChange={this.setVisible}
          partialVisibility
          containment={document.getElementById(containmentId)}
        />
      );

      return (
        <React.Fragment>
          {scrollUp && allowSensor && isMoreAvailable && sensor}
          {scrollUp && isMoreAvailable && (Loader ? <Loader /> : 'Loading ...')}
          <GnewMine
            gm={true}
            Component={Component}
            subscriptions={subscriptions}
            onLoaded={this.isThereMore}
            trigger={increment}
            incrementing={incrementing}
            {...this.props}
          />
          {!scrollUp && isMoreAvailable && (Loader ? <Loader /> : 'Loading ...')}
          {!scrollUp && allowSensor && isMoreAvailable && sensor}
        </React.Fragment>
      );
    }
  }

  WithLoadmore.propTypes = {
    containmentId: PropTypes.string,
    scrollUp: PropTypes.bool,
    Loader: PropTypes.func,
  };

  return hoistNonReactStatics(WithLoadmore, Component);
};

export default withLoadmore;
