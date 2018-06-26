import React from 'react';
import PropTypes from 'prop-types';

import GnewmineStore from './stores/GnewmineStore';

export default class GnewmineContainer extends React.Component {
  componentWillMount() {
    GnewmineStore.setSocket(this.props.socket);
    GnewmineStore.setHeaders(this.props.headers);
    GnewmineStore.setUserId(this.props.userId);
  }

  componentWillReceiveProps(nextProps) {
    GnewmineStore.setSocket(nextProps.socket);
    GnewmineStore.setHeaders(nextProps.headers);
    GnewmineStore.setUserId(nextProps.userId);
  }

  render() {
    return this.props.children;
  }
}

GnewmineContainer.propTypes = {
  socket: PropTypes.object,
  headers: PropTypes.object,
  userId: PropTypes.string,
  children: PropTypes.node,
};
