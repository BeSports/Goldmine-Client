import GnewminePusher from './GnewminePusher';
import axios from 'axios';
import deepDifference from 'deep-diff';

import React from 'react';

const withGnewmine = (Component, subscriptions) => {
  return props => {
    return (
      <GnewminePusher.Consumer>
        {socket => (
          <WithGnewmine
            {...props}
            socket={socket}
            Component={Component}
            subscriptions={subscriptions}
          />
        )}
      </GnewminePusher.Consumer>
    );
  };
};

class WithGnewmine extends React.Component {
  constructor() {
    super();
    this.applyUpdate = this.applyUpdate.bind(this);
    this.state = {
      loaded: false,
      data: {},
    };
  }

  componentWillMount() {
    const { socket } = this.props;

    axios.post(process.env.GNEWMINE_SERVER, { publication: 'storyForId' }).then(response => {
      this.setState({
        data: response.data,
        loaded: true,
      });
    });

    const applyUpdate = this.applyUpdate;

    const channel = socket.subscribe('storyForId');
    channel.bind('anEvent', data => {
      applyUpdate(data.diff);
    });
  }

  applyUpdate(differences) {
    const newData = _.cloneDeep(this.state.data);
    _.each(differences, singleDiff => {
      deepDifference.applyChange(newData, {}, singleDiff);
    });
    this.setState({
      data: newData,
    });
  }

  componentWillUnmount() {
    const { socket } = this.props;

    socket.unsubscribe('storyForId');
  }

  render() {
    const { Component } = this.props;
    const { data, loaded } = this.state;

    return <Component data={data} loaded={loaded} {...this.props} />;
  }
}

export default withGnewmine;
