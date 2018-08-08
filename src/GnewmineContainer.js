import React from 'react';
import PropTypes from 'prop-types';

import GnewmineStore from './stores/GnewmineStore';

export default class GnewmineContainer extends React.Component {
  componentWillMount() {
    GnewmineStore.setSocket(this.props.socket);
    GnewmineStore.setHeaders(this.props.headers);
    GnewmineStore.setUserId(this.props.userId);
    GnewmineStore.setHost(this.props.host);
  }

  componentWillReceiveProps(nextProps) {
    GnewmineStore.setSocket(nextProps.socket);
    GnewmineStore.setHeaders(nextProps.headers);
    GnewmineStore.setUserId(nextProps.userId);
    GnewmineStore.setHost(nextProps.host);
    GnewmineStore.setDisconnected(nextProps.forceUpdate);
  }

  render() {
    return this.props.children || null;
  }
}

GnewmineContainer.propTypes = {
  socket: PropTypes.object.isRequired,
  headers: PropTypes.object,
  userId: PropTypes.string,
  children: PropTypes.node,
  host: PropTypes.string,
  env: PropTypes.string,
};
